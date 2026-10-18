// @HU-GAR-12 @HU-GAR-14
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";

const conTitulo = { convocatoria: { select: { titulo: true, fechaHora: true } } };
const porFecha = { creadaEn: "asc" } as const;

/** Todo lo que M4 guarda de una persona (HU-GAR-12 CA1): lo propio, y la confirmación de su casa. */
export async function datosDe(usuarioId: string, predioId: string | null) {
  const [confirmaciones, delegaciones, propuestas, colaboraciones, voluntariados] = await Promise.all([
    predioId
      ? prisma.confirmacionAsistencia.findMany({ where: { predioId }, include: conTitulo, orderBy: porFecha })
      : [],
    prisma.delegacionVoto.findMany({
      where: { titularId: usuarioId },
      include: conTitulo,
      orderBy: porFecha,
    }),
    prisma.propuestaAgenda.findMany({ where: { autorId: usuarioId }, include: conTitulo, orderBy: porFecha }),
    prisma.colaboracion.findMany({ where: { autorId: usuarioId }, include: conTitulo, orderBy: porFecha }),
    prisma.voluntariado.findMany({ where: { autorId: usuarioId }, include: conTitulo, orderBy: porFecha }),
  ]);
  return { confirmaciones, delegaciones, propuestas, colaboraciones, voluntariados };
}

/**
 * Anonimiza lo de M4 de una persona (HU-GAR-14 CA3). El usuario sigue existiendo, ya sin nombre ni DNI, así que
 * los registros que apuntan a su id (propuestas, montos, confirmaciones) quedan como memoria de la junta sin
 * decir quién fue. Lo que sí se borra es lo que identifica a terceros o es texto libre: el nombre y el DNI del
 * apoderado, y lo que la persona escribió al ofrecerse de voluntaria.
 */
export async function anonimizarDe(tx: Transaccion, usuarioId: string) {
  const delegaciones = await tx.delegacionVoto.findMany({
    where: { titularId: usuarioId },
    select: { id: true },
  });
  for (const { id } of delegaciones) {
    await tx.delegacionVoto.update({
      where: { id },
      data: {
        apoderadoNombre: "Persona anonimizada",
        apoderadoDniHash: `anonimizado-${id}`,
        apoderadoDniFinal: "00",
      },
    });
  }
  await tx.voluntariado.updateMany({
    where: { autorId: usuarioId },
    data: { descripcion: "Texto eliminado por la cancelación de la cuenta." },
  });
}
