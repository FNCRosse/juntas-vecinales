// @HU-COB-03
import { archivosSubidosPor } from "@/compartido/archivos/registro";
import { generarPdf } from "@/compartido/archivos/pdf";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaCorta, fechaYHora } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import {
  MOTIVOS,
  MOTIVOS_RECLAMO,
  numeroDeReclamo,
  prepararReclamo,
} from "@/modulos/aportes/dominio/reclamo";
import { ultimaCuotaDe } from "@/modulos/aportes/infraestructura/repositorioCuotas";
import { bloquearCasa } from "@/modulos/aportes/infraestructura/repositorioPagos";
import {
  cuantasCuotasReclamables,
  crearReclamo,
  cuotasReclamables,
  hayReclamoEnRevision,
  reclamoDeLaCasa,
  reclamoEnRevisionDe,
  reclamoPorIdOperacion,
} from "@/modulos/aportes/infraestructura/repositorioReclamos";
import { directivaParaAvisar } from "@/modulos/identidad/aplicacion/barrio";
import { predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

export const USO_SUSTENTO_RECLAMO = "sustento_reclamo";
const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

const MENSAJE_DOCUMENTO =
  "El documento tiene que ser una foto o un PDF de hasta 5 MB. Si no puede subirlo, envíe el reclamo sin él.";

export const ESTADO_EN_TEXTO = {
  EN_REVISION: "En revisión",
  APROBADO: "Aprobado",
  RECHAZADO: "Se mantiene su cuota",
} as const;

type Reclamo = NonNullable<Awaited<ReturnType<typeof reclamoPorIdOperacion>>>;

export const aDto = (r: Reclamo) => ({
  id: r.id,
  numero: numeroDeReclamo(r.numero),
  enviado: fechaYHora(r.creadoEn),
  motivo: MOTIVOS[r.motivo],
  detalle: r.detalle,
  conDocumento: r.archivoId !== null,
  estado: ESTADO_EN_TEXTO[r.estado],
  respuesta: r.respuesta,
});

export type ReclamoDto = ReturnType<typeof aDto>;

const minuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1);

/** «S/ 5.00 por semana (casa + 1 inquilino)»: la cuota que se reclama, con lo que la compone. */
async function cuotaQueSeReclama(predioId: string) {
  const ultima = await ultimaCuotaDe(predioId);
  if (!ultima) return null;
  const partes = ultima.conceptos.map((l) =>
    l.clave === "casa" ? "casa" : `${l.cantidad} ${minuscula(l.nombre)}`,
  );
  return `${soles(ultima.montoCalculado)} por semana (${partes.join(" + ")})`;
}

/**
 * Lo que necesita «Reclamo sobre mi cuota» (VEC-COB-08): la cuota que reclama, los motivos que ofrece la lista y si la casa ya
 * tiene un reclamo en revisión (VEC-COB-11). Solo ve su casa (AC-7).
 */
export async function datosParaReclamar(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) throw new ErrorNoEncontrado();
  const [cuota, abierto, reclamables] = await Promise.all([
    cuotaQueSeReclama(casa.id),
    reclamoEnRevisionDe(casa.id),
    cuantasCuotasReclamables(casa.id),
  ]);
  return {
    cuota,
    /** Sin cuotas pendientes no hay nada que reclamar. */
    puedeReclamar: reclamables > 0,
    motivos: MOTIVOS_RECLAMO.map((valor) => ({ valor: valor as string, etiqueta: MOTIVOS[valor] })),
    abierto: abierto
      ? { id: abierto.id, numero: numeroDeReclamo(abierto.numero), fecha: fechaCorta(abierto.creadoEn) }
      : null,
  };
}

export type DatosParaReclamar = Awaited<ReturnType<typeof datosParaReclamar>>;

/**
 * La casa reclama el monto de su cuota (HU-COB-03): elige un motivo de la lista, cuenta más si quiere y puede adjuntar un
 * documento. Las cuotas que debe pasan a «En discrepancia» (CA2) y se avisa a la directiva; mientras el reclamo está en
 * revisión no se puede hacer otro (CA3). Repetir el mismo `idOperacion` devuelve el reclamo ya enviado sin avisar otra vez
 * (AC-5); el aviso y la auditoría van en la misma transacción (AC-6).
 */
export async function registrarReclamo(
  sesion: SesionDto,
  datos: { motivo: string; detalle?: string; archivoId?: string; idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_VECINO);
  const previo = await reclamoPorIdOperacion(datos.idOperacion);
  if (previo) {
    // Otra casa no puede ver ni reusar un reclamo ajeno con ese identificador (AC-7).
    const casa = await predioDelVecino(sesion.usuarioId);
    if (previo.solicitanteId !== sesion.usuarioId || previo.predioId !== casa?.id)
      throw new ErrorNoEncontrado();
    return { reclamo: aDto(previo), creado: false };
  }
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) throw new ErrorNoEncontrado();
  const { errores, reclamo } = prepararReclamo({ motivo: datos.motivo, detalle: datos.detalle ?? "" });
  if (datos.archivoId) {
    const propios = await archivosSubidosPor(sesion.usuarioId, USO_SUSTENTO_RECLAMO, [datos.archivoId]);
    if (!propios.has(datos.archivoId)) errores.archivoId = MENSAJE_DOCUMENTO;
  }
  if (!reclamo || Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);

  const destinatarios = await directivaParaAvisar();
  const creado = await prisma.$transaction(async (tx) => {
    await bloquearCasa(tx, casa.id);
    if (await hayReclamoEnRevision(tx, casa.id)) {
      throw new ErrorReglaNegocio(
        "Ya tiene un reclamo en revisión. Para no mezclar respuestas, espere a que la directiva conteste.",
      );
    }
    const cuotas = await cuotasReclamables(tx, casa.id);
    if (!cuotas.length) throw new ErrorReglaNegocio("No tiene cuotas pendientes que reclamar.");
    const fila = await crearReclamo(tx, {
      idOperacion: datos.idOperacion,
      predioId: casa.id,
      solicitanteId: sesion.usuarioId,
      motivo: reclamo.motivo,
      detalle: reclamo.detalle,
      archivoId: datos.archivoId || null,
      creadoEn: ahora,
      cuotas: cuotas.map((c) => ({ id: c.id, estado: c.estado as "PENDIENTE" | "VENCIDA" })),
    });
    await encolarAvisos(
      destinatarios.map((destinatarioId) => ({
        destinatarioId,
        tipo: "PAGOS" as const,
        titulo: "Un vecino reclamó su cuota",
        texto: `${sesion.nombreCompleto} (${casa.vivienda}) reclamó el monto de su cuota: ${minuscula(MOTIVOS[reclamo.motivo])}. Reclamo ${numeroDeReclamo(fila.numero)}. Véalo en Cobros.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "registrar_reclamo",
        entidad: "SolicitudAjusteTarifa",
        entidadId: fila.id,
        antes: null,
        despues: {
          reclamo: numeroDeReclamo(fila.numero),
          motivo: MOTIVOS[reclamo.motivo],
          cuotas: cuotas.length,
        },
      },
      tx,
    );
    return fila;
  });
  return { reclamo: aDto(creado), creado: true };
}

/** «Su reclamo está en revisión» (VEC-COB-10): solo de un reclamo de su casa (AC-7). */
export async function verMiReclamo(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  const reclamo = casa ? await reclamoDeLaCasa(casa.id, id) : null;
  if (!reclamo) throw new ErrorNoEncontrado();
  return aDto(reclamo);
}

/** La constancia del reclamo en PDF: solo de un reclamo de la casa de quien la pide (AC-7). */
export async function constanciaDeReclamo(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  const reclamo = casa ? await reclamoDeLaCasa(casa.id, id) : null;
  if (!casa || !reclamo) throw new ErrorNoEncontrado();
  const dto = aDto(reclamo);
  const pdf = await generarPdf({
    titulo: "Constancia de reclamo de cuota",
    subtitulos: [`N.° ${dto.numero}`, "Junta Vecinal de Villa de Fátima"],
    secciones: [
      {
        titulo: "Su reclamo",
        filas: [
          ["Casa", casa.vivienda],
          ["Enviado el", dto.enviado],
          ["Motivo", dto.motivo],
          ...(dto.detalle ? ([["Lo que contó", dto.detalle]] as [string, string][]) : []),
          ["Documento", dto.conDocumento ? "Adjuntó un documento" : "Sin documento"],
          ["Estado", dto.estado],
        ],
      },
    ],
    pie: "La directiva revisará su reclamo y le responderá. Mientras tanto no tiene que pagar la diferencia que reclama.",
  });
  return { pdf, nombreArchivo: `reclamo-${dto.numero}.pdf` };
}
