// @HU-ASA-06
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { type DocumentoPdf, generarPdf } from "@/compartido/archivos/pdf";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaEnFrase, fechaLarga, fechaYHora, horaCorta } from "@/compartido/fechas";
import { hashDeDni } from "@/modulos/identidad/aplicacion/garita";
import { predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { asambleaVigente } from "@/modulos/asambleas/aplicacion/convocatorias";
import {
  CONDICION_EN_TEXTO,
  type DatosDelegacion,
  excedeLimite,
  MAXIMO_REPRESENTACIONES,
  numeroDeConstancia,
  prepararDelegacion,
} from "@/modulos/asambleas/dominio/delegacion";
import {
  bloquearApoderado,
  borrarDelegacion,
  contarRepresentaciones,
  crearDelegacion,
  delegacionDePredio,
} from "@/modulos/asambleas/infraestructura/repositorioDelegaciones";

const ROLES = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

const MENSAJE_SIN_PREDIO =
  "No encontramos su vivienda en el padrón. Pida ayuda a la administración para delegar su voto.";

type Fila = NonNullable<Awaited<ReturnType<typeof delegacionDePredio>>>;

const aDto = (d: Fila) => ({
  id: d.id,
  numero: numeroDeConstancia(d.numero),
  apoderadoNombre: d.apoderadoNombre,
  dniTerminadoEn: d.apoderadoDniFinal,
  condicion: d.condicion,
  condicionTexto: CONDICION_EN_TEXTO[d.condicion],
  registradaEn: d.creadaEn.toISOString(),
});

export type DelegacionDto = ReturnType<typeof aDto>;

/**
 * El titular delega el voto de su casa en un apoderado (HU-ASA-06): nombre, DNI y condición (CA1), vinculada
 * a su predio con una constancia para la mesa (CA2), y sin que la misma persona pase del límite de casas
 * que puede representar (CA3). Hasta el plazo de la asamblea. Repetir la misma delegación devuelve la ya
 * hecha (AC-5); cambiar de apoderado exige anular primero. Auditada en la misma transacción (AC-6).
 */
export async function delegarVoto(
  sesion: SesionDto,
  asambleaId: string,
  datos: DatosDelegacion,
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES);
  const { errores, delegacion } = prepararDelegacion(datos);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);
  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) throw new ErrorReglaNegocio(MENSAJE_SIN_PREDIO);
  await asambleaVigente(asambleaId, ahora);

  const apoderadoDniHash = hashDeDni(delegacion.dni);
  const previa = await delegacionDePredio(asambleaId, predio.id);
  if (previa) {
    if (previa.apoderadoDniHash === apoderadoDniHash) return { delegacion: aDto(previa), creada: false };
    throw new ErrorReglaNegocio(
      "Su casa ya le dejó el voto a otra persona en esta asamblea. Anule esa delegación si quiere elegir a otra.",
    );
  }

  const creada = await prisma.$transaction(async (tx) => {
    await bloquearApoderado(tx, asambleaId, apoderadoDniHash);
    if (excedeLimite(await contarRepresentaciones(tx, asambleaId, apoderadoDniHash))) {
      throw new ErrorReglaNegocio(
        `Esta persona ya representa a ${MAXIMO_REPRESENTACIONES} casas. Es el máximo por asamblea. Elija a otra persona de su confianza o pida ayuda a la directiva.`,
      );
    }
    const fila = await crearDelegacion(tx, {
      convocatoriaId: asambleaId,
      predioId: predio.id,
      titularId: sesion.usuarioId,
      apoderadoNombre: delegacion.nombre,
      apoderadoDniHash,
      apoderadoDniFinal: delegacion.dni.slice(-2),
      condicion: delegacion.condicion,
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "delegar_voto",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: null,
        despues: {
          predioId: predio.id,
          apoderado: delegacion.nombre,
          dniTerminadoEn: delegacion.dni.slice(-2),
          condicion: delegacion.condicion,
          constancia: numeroDeConstancia(fila.numero),
        },
      },
      tx,
    );
    return fila;
  });
  return { delegacion: aDto(creada), creada: true };
}

/** La delegación de la casa del vecino en esa asamblea (VEC-ASA-05), o null si no delegó. */
export async function miDelegacion(sesion: SesionDto, asambleaId: string): Promise<DelegacionDto | null> {
  exigirRol(sesion, ...ROLES);
  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) return null;
  const fila = await delegacionDePredio(asambleaId, predio.id);
  return fila ? aDto(fila) : null;
}

/** El titular anula su delegación hasta el plazo: su voto vuelve a ser suyo. Queda en la auditoría. */
export async function anularDelegacion(sesion: SesionDto, asambleaId: string, ahora = new Date()) {
  exigirRol(sesion, ...ROLES);
  const predio = await predioDelVecino(sesion.usuarioId);
  if (!predio) throw new ErrorReglaNegocio(MENSAJE_SIN_PREDIO);
  await asambleaVigente(asambleaId, ahora);
  const previa = await delegacionDePredio(asambleaId, predio.id);
  if (!previa) throw new ErrorNoEncontrado();

  await prisma.$transaction(async (tx) => {
    await borrarDelegacion(tx, asambleaId, predio.id);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "anular_delegacion",
        entidad: "Asamblea",
        entidadId: asambleaId,
        antes: {
          predioId: predio.id,
          apoderado: previa.apoderadoNombre,
          constancia: numeroDeConstancia(previa.numero),
        },
        despues: null,
      },
      tx,
    );
  });
}

/**
 * La constancia de delegación en PDF para la mesa (HU-ASA-06 CA2). Solo la del propio titular: si no delegó,
 * 404, igual que con los datos de otra casa (AC-7).
 */
export async function constanciaDeDelegacion(sesion: SesionDto, asambleaId: string) {
  exigirRol(sesion, ...ROLES);
  const predio = await predioDelVecino(sesion.usuarioId);
  const fila = predio ? await delegacionDePredio(asambleaId, predio.id) : null;
  if (!predio || !fila) throw new ErrorNoEncontrado();
  const asamblea = await prisma.convocatoria.findUniqueOrThrow({
    where: { id: asambleaId },
    include: { asamblea: true },
  });
  const plazo = asamblea.asamblea?.confirmacionesHasta ?? asamblea.fechaHora;
  const numero = numeroDeConstancia(fila.numero);

  const documento: DocumentoPdf = {
    titulo: "Constancia de delegación de voto",
    subtitulos: [`N.° ${numero}`, "Junta Vecinal de Villa de Fátima"],
    secciones: [
      {
        titulo: "Asamblea",
        filas: [
          ["Asamblea", asamblea.titulo],
          ["Fecha", fechaLarga(asamblea.fechaHora)],
          ["Hora", horaCorta(asamblea.fechaHora)],
          ["Lugar", asamblea.lugar],
        ],
      },
      {
        titulo: "Titular",
        filas: [
          ["Nombre", sesion.nombreCompleto],
          ["Vivienda", predio.vivienda],
        ],
      },
      {
        titulo: "Apoderado",
        filas: [
          ["Nombre", fila.apoderadoNombre],
          ["Es para el titular", CONDICION_EN_TEXTO[fila.condicion]],
          ["DNI", `terminado en ${fila.apoderadoDniFinal}`],
        ],
      },
      {
        titulo: "Alcance",
        parrafos: [
          `El apoderado podrá votar en nombre del titular solo en esta asamblea. El titular puede anular la delegación hasta ${fechaEnFrase(plazo)} a las ${horaCorta(plazo)}.`,
        ],
      },
    ],
    pie: `Registrada el ${fechaYHora(fila.creadaEn)}. Entregue esta constancia a la mesa directiva el día de la asamblea.`,
  };
  return { pdf: await generarPdf(documento), nombreArchivo: `constancia-${numero}.pdf` };
}
