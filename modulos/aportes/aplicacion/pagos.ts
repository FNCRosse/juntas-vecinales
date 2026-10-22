// @HU-COB-08 @HU-COB-10
import { archivosSubidosPor } from "@/compartido/archivos/registro";
import { generarPdf } from "@/compartido/archivos/pdf";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaCorta, fechaYHora } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { aplicarAbono, lunesDe } from "@/modulos/aportes/dominio/cuota";
import { clasificarMorosidad } from "@/modulos/aportes/dominio/morosidad";
import {
  MOTIVOS,
  MOTIVOS_OBSERVACION,
  prepararObservacion,
  textoParaLaVecina,
} from "@/modulos/aportes/dominio/observacion";
import {
  MEDIOS,
  MEDIOS_DIGITALES,
  type MedioDigital,
  numeroDeConstancia,
  opcionesDePago,
  rangoDeSemanas,
} from "@/modulos/aportes/dominio/pago";
import { cuotasPorPagarDe } from "@/modulos/aportes/infraestructura/repositorioCuotas";
import {
  archivoPorId,
  bloquearCasa,
  comprobantePorId,
  crearPago,
  cuotasImpagasDe,
  cuotasEnRevision,
  deudaPorCasa,
  pagoDeLaCasa,
  pagoPorIdOperacion,
  type PagoConDetalle,
  pagosDeLaCasa,
  pagosPorRevisar,
  periodosDelPago,
  reclamarAprobacion,
  reclamarObservacion,
  reclamarReenvio,
  semanasEnOtroPago,
  semanasYaEnPago,
} from "@/modulos/aportes/infraestructura/repositorioPagos";
import { directivaParaAvisar, nombresDe } from "@/modulos/identidad/aplicacion/barrio";
import { casasDe, predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { actualizarEstadoMorosidad } from "@/modulos/identidad/aplicacion/visitas";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

export const USO_COMPROBANTE_PAGO = "comprobante_pago";
const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

const MENSAJE_FOTO =
  "Falta la foto de su comprobante, o pesa más de 5 MB. Suba una captura de pantalla; si no puede, pida ayuda a una persona.";

const ESTADO_EN_TEXTO = {
  REGISTRADO: "En revisión",
  APROBADO: "Aprobado",
  OBSERVADO: "Observado",
  RECHAZADO: "Rechazado",
} as const;

const diaYMes = (fecha: Date) => fechaCorta(fecha).replace(/ de \d{4}$/, "");

/** La observación que la casa todavía tiene que atender: la del último comprobante, si el pago sigue observado. */
function observacionVigente(pago: PagoConDetalle) {
  if (pago.estado !== "OBSERVADO") return null;
  const comprobante = pago.comprobantes.findLast((c) => c.estado === "OBSERVADO");
  return comprobante?.motivoObservacion
    ? { motivo: comprobante.motivoObservacion, nota: comprobante.nota }
    : null;
}

/** Las semanas que cubre un pago, en palabras: «2 semanas, del 7 al 20 de setiembre». */
async function semanasDelPago(pago: PagoConDetalle) {
  const lunes = (await periodosDelPago(pago.cuotas.map((c) => c.cuotaId))).map(lunesDe);
  if (!lunes.length) return "";
  const cuantas = `${lunes.length} ${lunes.length === 1 ? "semana" : "semanas"}`;
  return `${cuantas}, ${rangoDeSemanas(lunes[0], lunes.at(-1)!)}`;
}

async function aDto(pago: PagoConDetalle) {
  return {
    id: pago.id,
    constancia: numeroDeConstancia(pago.numero),
    monto: pago.monto,
    semanas: await semanasDelPago(pago),
    medio: MEDIOS[pago.medio],
    estado: ESTADO_EN_TEXTO[pago.estado],
    enviado: fechaYHora(pago.creadoEn),
  };
}

/** Las cuotas de la casa que todavía se pueden pagar: sin pagar del todo y fuera de un pago en revisión. */
async function cuotasPagables(predioId: string) {
  const cuotas = await cuotasPorPagarDe(predioId);
  const enRevision = await cuotasEnRevision(cuotas.map((c) => c.id));
  return cuotas
    .filter((c) => !enRevision.has(c.id))
    .map((c) => ({ id: c.id, periodo: lunesDe(c.periodo), saldo: c.saldoPendiente }));
}

/**
 * Lo que necesita «Pagar mi cuota» (VEC-COB-02): cuánto puede pagar la casa, cómo y a dónde. Los datos de pago de la
 * junta (número de Yape o Plin y cuenta) salen de la configuración, no del código: los pone la autora.
 */
export async function datosParaPagar(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) throw new ErrorNoEncontrado();
  const opciones = opcionesDePago(await cuotasPagables(casa.id)).map(
    ({ semanas, monto, titulo, detalle }) => ({
      semanas,
      monto,
      titulo,
      detalle,
    }),
  );
  return {
    vivienda: casa.vivienda,
    opciones,
    medios: MEDIOS_DIGITALES.map((valor) => ({ valor, etiqueta: MEDIOS[valor] })),
    datosDePago: {
      yape: process.env.DATOS_PAGO_YAPE ?? null,
      cuenta: process.env.DATOS_PAGO_CUENTA ?? null,
    },
  };
}

export type DatosParaPagar = Awaited<ReturnType<typeof datosParaPagar>>;

/**
 * Registra el pago que manda una casa con la foto de su comprobante (HU-COB-08): queda en revisión, con su constancia de
 * envío, y se avisa de inmediato a la directiva (CA2 y CA3). No cambia ninguna cuota: lo hace la directiva al
 * aprobarlo. Las semanas que ya están en otro pago en revisión no se pueden volver a pagar. Repetir el mismo
 * `idOperacion` devuelve el pago ya registrado sin avisar otra vez (AC-5). Todo en una transacción con su auditoría (AC-6).
 */
export async function registrarPagoDigital(
  sesion: SesionDto,
  datos: { semanas: number; medio: string; archivoId: string; idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_VECINO);
  const previa = await pagoPorIdOperacion(datos.idOperacion);
  if (previa) {
    // Otra persona no puede ver ni reusar un pago ajeno con ese identificador (AC-7).
    if (previa.autorId !== sesion.usuarioId) throw new ErrorNoEncontrado();
    return { pago: await aDto(previa), creado: false };
  }
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) throw new ErrorNoEncontrado();

  const opciones = opcionesDePago(await cuotasPagables(casa.id));
  const opcion = opciones.find((o) => o.semanas === datos.semanas);
  const medio = MEDIOS_DIGITALES.find((m): m is MedioDigital => m === datos.medio);
  const propios = datos.archivoId
    ? await archivosSubidosPor(sesion.usuarioId, USO_COMPROBANTE_PAGO, [datos.archivoId])
    : new Set<string>();
  const errores: Record<string, string> = {};
  if (!opcion) errores.semanas = "Elija cuánto va a pagar.";
  if (!medio) errores.medio = "Elija cómo va a pagar.";
  if (!propios.has(datos.archivoId)) errores.archivoId = MENSAJE_FOTO;
  if (Object.keys(errores).length || !opcion || !medio) throw new ErrorValidacion(undefined, errores);

  const destinatarios = await directivaParaAvisar();
  const cuotas = await prisma.cuota.findMany({ where: { id: { in: opcion.cuotaIds } } });
  const creado = await prisma.$transaction(async (tx) => {
    await bloquearCasa(tx, casa.id);
    if (await semanasYaEnPago(tx, opcion.cuotaIds)) {
      throw new ErrorReglaNegocio("Esas semanas ya están en un pago que la directiva está revisando.");
    }
    const fila = await crearPago(tx, {
      idOperacion: datos.idOperacion,
      predioId: casa.id,
      autorId: sesion.usuarioId,
      medio,
      monto: opcion.monto,
      creadoEn: ahora,
      archivoId: datos.archivoId,
      cuotas: cuotas.map((c) => ({ cuotaId: c.id, monto: c.saldoPendiente })),
    });
    await encolarAvisos(
      destinatarios.map((destinatarioId) => ({
        destinatarioId,
        tipo: "PAGOS" as const,
        titulo: "Llegó un comprobante de pago",
        texto: `${casa.vivienda} mandó su pago de ${soles(opcion.monto)} por ${MEDIOS[medio]}. Revíselo en Cobros.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "registrar_pago_digital",
        entidad: "Pago",
        entidadId: fila.id,
        antes: null,
        despues: {
          constancia: numeroDeConstancia(fila.numero),
          monto: soles(opcion.monto),
          medio: MEDIOS[medio],
          semanas: opcion.semanas,
        },
      },
      tx,
    );
    return fila;
  });
  return { pago: await aDto(creado), creado: true };
}

/** Mis pagos (VEC-COB-05): los pagos de la casa con su fecha, su medio y su estado, el más reciente primero. */
export async function misPagos(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) return { pagos: [] };
  return {
    pagos: (await pagosDeLaCasa(casa.id)).map((p) => {
      const observado = observacionVigente(p);
      return {
        id: p.id,
        titulo: `Pago del ${diaYMes(p.creadoEn)}`,
        monto: p.monto,
        detalle: `${fechaCorta(p.creadoEn)} · ${MEDIOS[p.medio]}`,
        estado: ESTADO_EN_TEXTO[p.estado],
        constancia: numeroDeConstancia(p.numero),
        // «Observado: la foto se ve borrosa» y el camino para subsanarlo (HU-COB-10 CA2 y CA3).
        motivo: observado ? textoParaLaVecina(observado.motivo, observado.nota).resumen : null,
        puedeEnviarOtraFoto: observado !== null,
      };
    }),
  };
}

/** La constancia de envío en PDF: solo de un pago de la casa de quien la pide (AC-7). */
export async function constanciaDePago(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  const pago = casa ? await pagoDeLaCasa(casa.id, id) : null;
  if (!casa || !pago) throw new ErrorNoEncontrado();
  const dto = await aDto(pago);
  const pdf = await generarPdf({
    titulo: "Constancia de envío de pago",
    subtitulos: [`N.° ${dto.constancia}`, "Junta Vecinal de Villa de Fátima"],
    secciones: [
      {
        titulo: "Su pago",
        filas: [
          ["Casa", casa.vivienda],
          ["Monto", soles(dto.monto)],
          ["Qué paga", dto.semanas],
          ["Cómo pagó", dto.medio],
          ["Enviado el", dto.enviado],
          ["Estado", "Pendiente de revisión: la directiva revisará su comprobante."],
        ],
      },
    ],
    pie: "Esta constancia no es el recibo oficial. Cuando la directiva valide su pago, le llegará su recibo.",
  });
  return { pdf, nombreArchivo: `constancia-${dto.constancia}.pdf` };
}

/**
 * Cobros: comprobantes por revisar (DIR-COB-01): los pagos digitales que esperan a la directiva, el más reciente
 * primero, con lo que debía la casa. Un pago de la casa de quien revisa se marca para que lo revise otro miembro.
 */
export async function comprobantesPorRevisar(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const pagos = await pagosPorRevisar();
  const predios = [...new Set(pagos.map((p) => p.predioId))];
  const [casas, deudas, nombres, miCasa] = await Promise.all([
    casasDe(predios),
    deudaPorCasa(predios),
    nombresDe([...new Set(pagos.map((p) => p.autorId))]),
    predioDelVecino(sesion.usuarioId),
  ]);
  return {
    items: pagos.map((p) => {
      const debia = deudas.get(p.predioId) ?? 0;
      return {
        id: p.id,
        comprobanteId: p.comprobantes.find((c) => c.estado === "PENDIENTE_REVISION")?.id ?? null,
        medio: MEDIOS[p.medio],
        nombre: nombres.get(p.autorId) ?? "",
        vivienda: casas.get(p.predioId)?.vivienda ?? "",
        debia,
        fecha: fechaYHora(p.creadoEn),
        monto: p.monto,
        etiqueta: p.monto < debia ? "Pago parcial" : "Por revisar",
        esSuyo: p.autorId === sesion.usuarioId || p.predioId === miCasa?.id,
      };
    }),
  };
}

export type ComprobantesPorRevisar = Awaited<ReturnType<typeof comprobantesPorRevisar>>;

/** Dónde se hizo el pago, para que la directiva compare con la captura (viene de la configuración, no del código). */
const cuentaDeDestino = (medio: "YAPE_O_PLIN" | "TRANSFERENCIA") =>
  medio === "YAPE_O_PLIN"
    ? `Yape o Plin: ${process.env.DATOS_PAGO_YAPE ?? "sin configurar"}`
    : `Cuenta bancaria: ${process.env.DATOS_PAGO_CUENTA ?? "sin configurar"}`;

/**
 * Revisar un comprobante (DIR-COB-02, HU-COB-09 CA1): la captura junto a lo que declaró la casa, lo que debe hoy, la
 * fecha y la cuenta de destino, y qué pasaría si se aprueba. Solo la directiva y los mediadores lo ven; aprobar,
 * solo la directiva, y nunca el pago de su propia casa (lo revisa otro miembro).
 */
export async function verComprobante(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const comprobante = await comprobantePorId(id);
  if (!comprobante) throw new ErrorNoEncontrado();
  const pago = comprobante.pago;
  const [casas, deudas, nombres, miCasa, archivo] = await Promise.all([
    casasDe([pago.predioId]),
    deudaPorCasa([pago.predioId]),
    nombresDe([pago.autorId]),
    predioDelVecino(sesion.usuarioId),
    archivoPorId(comprobante.archivoId),
  ]);
  const debe = deudas.get(pago.predioId) ?? 0;
  const falta = Math.max(0, debe - pago.monto);
  const esSuyo = pago.autorId === sesion.usuarioId || pago.predioId === miCasa?.id;
  return {
    id: comprobante.id,
    estado:
      pago.estado === "REGISTRADO" && comprobante.estado === "OBSERVADO"
        ? "Observado"
        : ESTADO_EN_TEXTO[pago.estado],
    nombre: nombres.get(pago.autorId) ?? "",
    vivienda: casas.get(pago.predioId)?.vivienda ?? "",
    monto: pago.monto,
    debe,
    semanas: await semanasDelPago(pago),
    medio: MEDIOS[pago.medio],
    enviado: fechaYHora(pago.creadoEn),
    cuentaDeDestino: cuentaDeDestino(pago.medio),
    cubre: falta === 0 ? "Cubre el 100 %" : `Cubre una parte: ${soles(pago.monto)} de ${soles(debe)}`,
    efecto:
      falta === 0
        ? "Si lo aprueba, el pago queda Aprobado y la casa pasa a Al día."
        : `Si lo aprueba, el pago queda Aprobado y la casa todavía debe ${soles(falta)}.`,
    archivo: archivo ? { id: archivo.id, tipo: archivo.tipo } : null,
    esSuyo,
    // Aprobar y observar los decide la directiva, sobre el comprobante que espera revisión y no sobre el pago propio.
    puedeAprobar:
      sesion.roles.includes("DIRECTIVA") &&
      !esSuyo &&
      pago.estado === "REGISTRADO" &&
      comprobante.estado === "PENDIENTE_REVISION",
  };
}

export type ComprobanteParaRevisar = Awaited<ReturnType<typeof verComprobante>>;

/**
 * Aprueba el pago de un comprobante (HU-COB-09 CA2 y CA3): el abono se aplica a las cuotas que cubría, de modo que
 * las que se completan quedan pagadas y, si es parcial, queda el saldo que falta. Si la casa ya no tiene atraso crítico,
 * la garita se restituye en la misma transacción (R-05). Avisa a quien pagó y se audita (AC-6). Aprobar dos veces no
 * abona dos veces (AC-5): el cambio de estado es un UPDATE condicionado.
 */
export async function aprobarComprobante(sesion: SesionDto, comprobanteId: string, ahora = new Date()) {
  exigirRol(sesion, "DIRECTIVA");
  const comprobante = await comprobantePorId(comprobanteId);
  if (!comprobante) throw new ErrorNoEncontrado();
  const pago = comprobante.pago;
  const miCasa = await predioDelVecino(sesion.usuarioId);
  if (pago.autorId === sesion.usuarioId || pago.predioId === miCasa?.id) {
    throw new ErrorReglaNegocio("Es el pago de su casa: lo revisa otro miembro de la directiva.");
  }
  if ((pago.estado !== "REGISTRADO" && pago.estado !== "APROBADO") || comprobante.estado === "OBSERVADO") {
    throw new ErrorReglaNegocio("Ese pago ya fue revisado.");
  }
  const [casas, nombres] = await Promise.all([casasDe([pago.predioId]), nombresDe([pago.autorId])]);

  const { aplicado, debeAhora } = await prisma.$transaction(async (tx) => {
    await bloquearCasa(tx, pago.predioId);
    const reclamado = await reclamarAprobacion(tx, pago.id);
    if (reclamado) {
      await tx.comprobante.update({ where: { id: comprobante.id }, data: { estado: "APROBADO" } });
      for (const parte of pago.cuotas) {
        const cuota = await tx.cuota.findUniqueOrThrow({ where: { id: parte.cuotaId } });
        if (cuota.estado === "PAGADA") continue;
        const { saldo, estado } = aplicarAbono(
          cuota.saldoPendiente,
          parte.monto,
          cuota.estado as "PENDIENTE" | "VENCIDA" | "EN_DISCREPANCIA",
        );
        await tx.cuota.update({ where: { id: cuota.id }, data: { saldoPendiente: saldo, estado } });
      }
    }
    const impagas = await cuotasImpagasDe(tx, pago.predioId);
    const debe = impagas.reduce((suma, c) => suma + c.saldoPendiente, 0);
    if (reclamado) {
      // Solo se restituye la garita si ya no hay atraso crítico; suspenderla es de la tarea de morosidad (HU-COB-06).
      if (clasificarMorosidad(impagas, ahora) !== "MOROSO_CRITICO") {
        await actualizarEstadoMorosidad(pago.predioId, "VERDE", tx);
      }
      await encolarAvisos(
        [
          {
            destinatarioId: pago.autorId,
            tipo: "PAGOS" as const,
            titulo: "Su pago fue aprobado",
            texto:
              debe === 0
                ? `Recibimos su pago de ${soles(pago.monto)}. Ya está al día. Gracias.`
                : `Recibimos su pago de ${soles(pago.monto)}. Todavía le faltan ${soles(debe)} de su cuota. Puede pagarlo cuando pueda.`,
          },
        ],
        tx,
      );
      await registrarAuditoria(
        {
          actorId: sesion.usuarioId,
          accion: "aprobar_pago",
          entidad: "Pago",
          entidadId: pago.id,
          antes: null,
          despues: {
            constancia: numeroDeConstancia(pago.numero),
            monto: soles(pago.monto),
            debeAhora: soles(debe),
          },
        },
        tx,
      );
    }
    return { aplicado: reclamado, debeAhora: debe };
  });
  return {
    aplicado,
    pagoId: pago.id,
    nombre: nombres.get(pago.autorId) ?? "",
    vivienda: casas.get(pago.predioId)?.vivienda ?? "",
    monto: pago.monto,
    debeAhora,
    alDia: debeAhora === 0,
  };
}

/** Los motivos que ofrece «Observar» (HU-COB-10 CA1), con la palabra que lee la directiva. */
export const motivosDeObservacion = MOTIVOS_OBSERVACION.map((valor) => ({
  valor,
  etiqueta: MOTIVOS[valor].etiqueta,
}));

/**
 * Marca un comprobante como observado con un motivo (HU-COB-10 CA1 y CA2): el pago queda observado y sale de la bandeja,
 * no toca ninguna cuota y se avisa a quien pagó el motivo en llano, para que mande otra foto (CA3). Solo la directiva y
 * nunca el pago de su propia casa. Observar dos veces no avisa dos veces (AC-5: el cambio de estado es un UPDATE
 * condicionado) y queda en la auditoría en la misma transacción (AC-6).
 */
export async function observarComprobante(
  sesion: SesionDto,
  comprobanteId: string,
  datos: { motivo: string; nota?: string },
) {
  exigirRol(sesion, "DIRECTIVA");
  const comprobante = await comprobantePorId(comprobanteId);
  if (!comprobante) throw new ErrorNoEncontrado();
  const pago = comprobante.pago;
  const miCasa = await predioDelVecino(sesion.usuarioId);
  if (pago.autorId === sesion.usuarioId || pago.predioId === miCasa?.id) {
    throw new ErrorReglaNegocio("Es el pago de su casa: lo revisa otro miembro de la directiva.");
  }
  const { errores, observacion } = prepararObservacion({ motivo: datos.motivo, nota: datos.nota ?? "" });
  if (!observacion) throw new ErrorValidacion(undefined, errores);
  const repetido = comprobante.estado === "OBSERVADO" && pago.estado === "OBSERVADO";
  if (!repetido && (pago.estado !== "REGISTRADO" || comprobante.estado !== "PENDIENTE_REVISION")) {
    throw new ErrorReglaNegocio("Ese pago ya fue revisado.");
  }
  const [casas, nombres] = await Promise.all([casasDe([pago.predioId]), nombresDe([pago.autorId])]);
  const texto = textoParaLaVecina(observacion.motivo, observacion.nota);

  const aplicado = await prisma.$transaction(async (tx) => {
    await bloquearCasa(tx, pago.predioId);
    if (!(await reclamarObservacion(tx, pago.id))) return false;
    const { count } = await tx.comprobante.updateMany({
      where: { id: comprobante.id, estado: "PENDIENTE_REVISION" },
      data: { estado: "OBSERVADO", motivoObservacion: observacion.motivo, nota: observacion.nota },
    });
    if (count !== 1) throw new ErrorReglaNegocio("Ese pago ya fue revisado.");
    await encolarAvisos(
      [
        {
          destinatarioId: pago.autorId,
          tipo: "PAGOS" as const,
          titulo: "Su pago quedó observado",
          texto: `Su pago de ${soles(pago.monto)} quedó observado. ${texto.titulo}. ${texto.texto} Lo encuentra en Mis pagos.`,
        },
      ],
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "observar_pago",
        entidad: "Pago",
        entidadId: pago.id,
        antes: null,
        despues: {
          constancia: numeroDeConstancia(pago.numero),
          monto: soles(pago.monto),
          motivo: MOTIVOS[observacion.motivo].etiqueta,
          nota: observacion.nota,
        },
      },
      tx,
    );
    return true;
  });
  return {
    aplicado,
    pagoId: pago.id,
    nombre: nombres.get(pago.autorId) ?? "",
    vivienda: casas.get(pago.predioId)?.vivienda ?? "",
    monto: pago.monto,
  };
}

/**
 * «Enviar otra foto» (VEC-COB-07): qué le pasó a su pago y qué foto hace falta. Solo de un pago de su casa (AC-7).
 * `puedeEnviar` es falso si el pago ya no está observado (por ejemplo, ya mandó la foto nueva).
 */
export async function pagoParaOtraFoto(sesion: SesionDto, pagoId: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  const pago = casa ? await pagoDeLaCasa(casa.id, pagoId) : null;
  if (!pago) throw new ErrorNoEncontrado();
  const observado = observacionVigente(pago);
  const texto = observado ? textoParaLaVecina(observado.motivo, observado.nota) : { titulo: "", texto: "" };
  return {
    id: pago.id,
    resumen: `Su pago de ${soles(pago.monto)} del ${diaYMes(pago.creadoEn)} sigue guardado.`,
    titulo: texto.titulo,
    texto: texto.texto,
    puedeEnviar: observado !== null,
  };
}

export type PagoParaOtraFoto = Awaited<ReturnType<typeof pagoParaOtraFoto>>;

/**
 * La casa manda otra foto de un pago observado (HU-COB-10 CA3): el pago vuelve a revisión con un comprobante nuevo y se
 * avisa a la directiva. Las semanas del pago no pueden estar ya pagadas ni en otro pago en revisión (si pagó de nuevo,
 * no se cuenta dos veces). Repetir la misma foto no avisa otra vez (AC-5) y queda en la auditoría (AC-6).
 */
export async function enviarOtraFoto(
  sesion: SesionDto,
  pagoId: string,
  datos: { archivoId: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  const pago = casa ? await pagoDeLaCasa(casa.id, pagoId) : null;
  if (!casa || !pago) throw new ErrorNoEncontrado();
  if (pago.estado === "REGISTRADO" && pago.comprobantes.at(-1)?.archivoId === datos.archivoId) {
    return { aplicado: false, pago: await aDto(pago) };
  }
  if (pago.estado !== "OBSERVADO") throw new ErrorReglaNegocio("Ese pago no necesita otra foto.");
  const propios = datos.archivoId
    ? await archivosSubidosPor(sesion.usuarioId, USO_COMPROBANTE_PAGO, [datos.archivoId])
    : new Set<string>();
  if (!propios.has(datos.archivoId)) throw new ErrorValidacion(undefined, { archivoId: MENSAJE_FOTO });

  const destinatarios = await directivaParaAvisar();
  const cuotaIds = pago.cuotas.map((c) => c.cuotaId);
  const aplicado = await prisma.$transaction(async (tx) => {
    await bloquearCasa(tx, casa.id);
    if (await semanasEnOtroPago(tx, pago.id, cuotaIds)) {
      throw new ErrorReglaNegocio("Esas semanas ya están en un pago que la directiva está revisando.");
    }
    if (await tx.cuota.count({ where: { id: { in: cuotaIds }, estado: "PAGADA" } })) {
      throw new ErrorReglaNegocio("Alguna de esas semanas ya está pagada. Vea lo que falta en Mi cuota.");
    }
    if (!(await reclamarReenvio(tx, pago.id))) return false;
    await tx.comprobante.create({ data: { pagoId: pago.id, archivoId: datos.archivoId, creadoEn: ahora } });
    await encolarAvisos(
      destinatarios.map((destinatarioId) => ({
        destinatarioId,
        tipo: "PAGOS" as const,
        titulo: "Llegó otra foto de un pago",
        texto: `${casa.vivienda} mandó otra foto de su pago de ${soles(pago.monto)}. Revísela en Cobros.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "reenviar_comprobante",
        entidad: "Pago",
        entidadId: pago.id,
        antes: null,
        despues: { constancia: numeroDeConstancia(pago.numero), monto: soles(pago.monto) },
      },
      tx,
    );
    return true;
  });
  const actual = await pagoDeLaCasa(casa.id, pago.id);
  return { aplicado, pago: await aDto(actual ?? pago) };
}
