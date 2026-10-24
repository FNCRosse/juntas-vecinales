// @HU-COB-04
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaCorta } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { ESTADO_EN_TEXTO } from "@/modulos/aportes/aplicacion/reclamos";
import {
  ajustesPosibles,
  cuotaAjustada,
  MOTIVOS,
  numeroDeReclamo,
  prepararDecision,
} from "@/modulos/aportes/dominio/reclamo";
import { cuotasPorPagarDe, ultimaCuotaDe } from "@/modulos/aportes/infraestructura/repositorioCuotas";
import {
  archivoPorId,
  bloquearCasa,
  cuotasImpagasDe,
} from "@/modulos/aportes/infraestructura/repositorioPagos";
import {
  reclamoPorId,
  reclamosEnRevision,
  reclamosRespondidosDe,
} from "@/modulos/aportes/infraestructura/repositorioReclamos";
import { nombresDe } from "@/modulos/identidad/aplicacion/barrio";
import {
  casasDe,
  predioDelVecino,
  quitarUnaUnidadDeOcupacion,
} from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

const minuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1);
const porSemana = (centimos: number) => `${soles(centimos)} por semana`;

/** Cobros: los reclamos de cuota por atender (DIR-COB-12), el más reciente primero. */
export async function reclamosPorAtender(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const reclamos = await reclamosEnRevision();
  const [casas, nombres, miCasa] = await Promise.all([
    casasDe([...new Set(reclamos.map((r) => r.predioId))]),
    nombresDe([...new Set(reclamos.map((r) => r.solicitanteId))]),
    predioDelVecino(sesion.usuarioId),
  ]);
  return {
    items: reclamos.map((r) => {
      const esSuyo = r.predioId === miCasa?.id;
      return {
        id: r.id,
        numero: numeroDeReclamo(r.numero),
        nombre: nombres.get(r.solicitanteId) ?? "",
        vivienda: casas.get(r.predioId)?.vivienda ?? "",
        motivo: MOTIVOS[r.motivo],
        fecha: fechaCorta(r.creadoEn),
        esSuyo,
        puedeRevisar: sesion.roles.includes("DIRECTIVA") && !esSuyo,
      };
    }),
  };
}

export type ReclamosPorAtender = Awaited<ReturnType<typeof reclamosPorAtender>>;

/**
 * Auditar un reclamo (DIR-COB-13, HU-COB-04 CA1): lo que pide la casa, su cuota de hoy con lo que la compone, el documento,
 * los antecedentes del predio y qué se puede decidir. Solo se ofrece aprobar un ajuste que corresponde al motivo y a lo
 * que la cuota tiene; «ya pagué» solo se puede mantener (el pago se registra aparte). Decidir es de la directiva y nunca
 * sobre el reclamo de su propia casa.
 */
export async function verReclamoParaDecidir(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const reclamo = await reclamoPorId(id);
  if (!reclamo) throw new ErrorNoEncontrado();
  const [casas, nombres, ultima, pendientes, anteriores, documento, miCasa] = await Promise.all([
    casasDe([reclamo.predioId]),
    nombresDe([reclamo.solicitanteId]),
    ultimaCuotaDe(reclamo.predioId),
    cuotasPorPagarDe(reclamo.predioId),
    reclamosRespondidosDe(reclamo.predioId),
    reclamo.archivoId ? archivoPorId(reclamo.archivoId) : null,
    predioDelVecino(sesion.usuarioId),
  ]);
  const lineas = ultima?.conceptos ?? [];
  const montoActual = ultima?.montoCalculado ?? 0;
  const esSuyo = reclamo.predioId === miCasa?.id;
  return {
    id: reclamo.id,
    numero: numeroDeReclamo(reclamo.numero),
    nombre: nombres.get(reclamo.solicitanteId) ?? "",
    vivienda: casas.get(reclamo.predioId)?.vivienda ?? "",
    enviado: fechaCorta(reclamo.creadoEn),
    motivo: MOTIVOS[reclamo.motivo],
    detalle: reclamo.detalle,
    documento: documento ? { id: documento.id, tipo: documento.tipo } : null,
    cuotaActual: porSemana(montoActual),
    antecedentes: {
      conceptos: lineas
        .map((l, i) => `${i === 0 ? l.nombre : minuscula(l.nombre)} ${soles(l.subtotal)}`)
        .join(" + "),
      reclamosAnteriores: anteriores === 0 ? "Ninguno" : String(anteriores),
      pagos: pendientes.length
        ? `${pendientes.length} ${pendientes.length === 1 ? "semana pendiente" : "semanas pendientes"}`
        : "Al día",
    },
    opciones: [
      ...ajustesPosibles(
        reclamo.motivo,
        lineas.map((l) => ({
          clave: l.clave,
          nombre: l.nombre,
          montoUnitario: l.montoUnitario,
          cantidad: l.cantidad,
        })),
      ).map((a) => ({
        valor: `APROBAR:${a.clave}`,
        titulo: "Aprobar el ajuste",
        detalle: `Se quita el concepto ${minuscula(a.nombre)}: la cuota baja de ${soles(montoActual)} a ${soles(montoActual - a.unitario)} por semana`,
      })),
      {
        valor: "MANTENER",
        titulo: `Mantener la cuota de ${soles(montoActual)}`,
        detalle: "Tendrá que explicar el motivo",
      },
    ],
    estado: ESTADO_EN_TEXTO[reclamo.estado],
    esSuyo,
    puedeDecidir: sesion.roles.includes("DIRECTIVA") && !esSuyo && reclamo.estado === "EN_REVISION",
  };
}

export type ReclamoParaDecidir = Awaited<ReturnType<typeof verReclamoParaDecidir>>;

/**
 * Responde un reclamo (HU-COB-04 CA2 y CA3). **Aprobar el ajuste:** quita una unidad del concepto de cada cuota que el
 * reclamo cubría, deja lo que falta pagar en lo que corresponde, corrige el padrón para que las cuotas que vienen ya no la
 * cobren y avisa a la casa su nuevo importe. **Mantener la cuota:** devuelve las cuotas a su estado anterior y le explica el
 * motivo. En los dos casos la casa podrá reclamar de nuevo si lo necesita. Todo en una transacción con su auditoría (AC-6);
 * responder dos veces no cambia nada ni avisa otra vez (AC-5: el cambio de estado es un UPDATE condicionado). Solo la
 * directiva, y nunca sobre la cuota de su propia casa.
 */
export async function decidirReclamo(
  sesion: SesionDto,
  id: string,
  datos: { decision: string; motivo?: string },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA");
  const reclamo = await reclamoPorId(id);
  if (!reclamo) throw new ErrorNoEncontrado();
  const miCasa = await predioDelVecino(sesion.usuarioId);
  if (reclamo.predioId === miCasa?.id) {
    throw new ErrorReglaNegocio("Es el reclamo de su casa: lo revisa otro miembro de la directiva.");
  }
  const { errores, decision } = prepararDecision({ decision: datos.decision, motivo: datos.motivo ?? "" });
  if (!decision) throw new ErrorValidacion(undefined, errores);
  const [casas, nombres, ultima] = await Promise.all([
    casasDe([reclamo.predioId]),
    nombresDe([reclamo.solicitanteId]),
    ultimaCuotaDe(reclamo.predioId),
  ]);
  const montoActual = ultima?.montoCalculado ?? 0;
  let ajuste: { clave: string; nombre: string; unitario: number } | undefined;
  if (decision.tipo === "APROBAR") {
    ajuste = ajustesPosibles(
      reclamo.motivo,
      (ultima?.conceptos ?? []).map((l) => ({
        clave: l.clave,
        nombre: l.nombre,
        montoUnitario: l.montoUnitario,
        cantidad: l.cantidad,
      })),
    ).find((a) => a.clave === decision.clave);
    if (!ajuste) throw new ErrorReglaNegocio("Ese ajuste no corresponde a este reclamo.");
  }
  const montoNuevo = ajuste ? montoActual - ajuste.unitario : montoActual;
  const respuesta =
    decision.tipo === "APROBAR"
      ? `La cuota baja de ${soles(montoActual)} a ${soles(montoNuevo)} por semana.`
      : decision.motivo;
  const residentes = casas.get(reclamo.predioId)?.residentes ?? [];

  const hecho = await prisma.$transaction(async (tx) => {
    await bloquearCasa(tx, reclamo.predioId);
    const { count } = await tx.solicitudAjusteTarifa.updateMany({
      where: { id: reclamo.id, estado: "EN_REVISION" },
      data: {
        estado: decision.tipo === "APROBAR" ? "APROBADO" : "RECHAZADO",
        decididoPorId: sesion.usuarioId,
        decididoEn: ahora,
        conceptoAjustado: ajuste?.clave ?? null,
        respuesta,
      },
    });
    if (count !== 1) return null;
    const filas = await tx.reclamoCuota.findMany({ where: { reclamoId: reclamo.id } });
    for (const fila of filas) {
      const cuota = await tx.cuota.findUniqueOrThrow({
        where: { id: fila.cuotaId },
        include: { conceptos: true },
      });
      const linea = ajuste && cuota.conceptos.find((c) => c.clave === ajuste.clave && c.cantidad > 0);
      if (linea) {
        const { montoNuevo: nuevo, saldoNuevo } = cuotaAjustada(
          cuota.montoCalculado,
          cuota.saldoPendiente,
          linea.montoUnitario,
        );
        await tx.cuota.update({
          where: { id: cuota.id },
          data: {
            montoCalculado: nuevo,
            saldoPendiente: saldoNuevo,
            estado: saldoNuevo === 0 ? "PAGADA" : fila.estadoAnterior,
          },
        });
        await tx.reclamoCuota.update({
          where: { id: fila.id },
          data: { montoAnterior: cuota.montoCalculado, montoNuevo: nuevo },
        });
      } else {
        await tx.cuota.update({ where: { id: cuota.id }, data: { estado: fila.estadoAnterior } });
      }
    }
    if (ajuste) await quitarUnaUnidadDeOcupacion(reclamo.predioId, ajuste.clave, sesion.usuarioId, tx);
    const debe = (await cuotasImpagasDe(tx, reclamo.predioId)).reduce(
      (suma, c) => suma + c.saldoPendiente,
      0,
    );
    await encolarAvisos(
      residentes.map((destinatarioId) => ({
        destinatarioId,
        tipo: "PAGOS" as const,
        titulo: decision.tipo === "APROBAR" ? "Su reclamo fue aprobado" : "Revisamos su reclamo",
        texto:
          decision.tipo === "APROBAR"
            ? `Ajustamos su cuota: baja de ${soles(montoActual)} a ${soles(montoNuevo)} por semana. Lo que debe hoy es ${soles(debe)}. Gracias por avisarnos.`
            : `Se mantiene su cuota de ${soles(montoActual)} por semana. ${decision.motivo.replace(/[.\s]+$/, "")}. Si no está de acuerdo, converse con la directiva.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: decision.tipo === "APROBAR" ? "aprobar_reclamo" : "mantener_cuota_por_reclamo",
        entidad: "SolicitudAjusteTarifa",
        entidadId: reclamo.id,
        antes: { cuota: porSemana(montoActual) },
        despues: {
          reclamo: numeroDeReclamo(reclamo.numero),
          decision:
            decision.tipo === "APROBAR"
              ? `Aprobó el ajuste: quitó ${minuscula(ajuste!.nombre)}`
              : "Mantuvo la cuota",
          cuota: porSemana(montoNuevo),
          ...(decision.tipo === "MANTENER" ? { motivo: decision.motivo } : {}),
        },
      },
      tx,
    );
    return { debe };
  });

  return {
    aplicado: hecho !== null,
    estado: decision.tipo === "APROBAR" ? ESTADO_EN_TEXTO.APROBADO : ESTADO_EN_TEXTO.RECHAZADO,
    nombre: nombres.get(reclamo.solicitanteId) ?? "",
    vivienda: casas.get(reclamo.predioId)?.vivienda ?? "",
    cuotaAhora: porSemana(montoNuevo),
    debeAhora: hecho?.debe ?? null,
  };
}

export type DecisionDeReclamo = Awaited<ReturnType<typeof decidirReclamo>>;
