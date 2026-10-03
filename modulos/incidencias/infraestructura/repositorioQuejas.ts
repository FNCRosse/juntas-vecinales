import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { CategoriaQueja, EstadoQueja, Prisma } from "@/compartido/bd/generado/client";

const conEvidencias = { evidencias: { orderBy: { orden: "asc" } } } as const;

export async function buscarPorIdOperacion(idOperacion: string) {
  return prisma.queja.findUnique({ where: { idOperacion }, include: conEvidencias });
}

/** El siguiente correlativo, antes de crear la fila: con él se arma el código de seguimiento. */
export async function siguienteNumero(tx: Transaccion) {
  const [{ numero }] = await tx.$queryRaw<{ numero: bigint }[]>`
    SELECT nextval(pg_get_serial_sequence('incidencias_quejas', 'numero')) AS numero`;
  return Number(numero);
}

export async function crearQueja(
  tx: Transaccion,
  datos: {
    numero: number;
    codigoTicket: string;
    categoria: CategoriaQueja;
    descripcion: string;
    manzana: string | null;
    referencia: string | null;
    latitud: number | null;
    longitud: number | null;
    fechaRegistro: Date;
    esAnonimo: boolean;
    denuncianteId: string | null;
    registradaPor: string | null;
    identidad: { hashDenunciante: string; datosCifrados: string } | null;
    consentimientoVersion: string;
    consentimientoEn: Date;
    idOperacion: string;
    evidencias: string[];
  },
) {
  const { evidencias, identidad, ...queja } = datos;
  return tx.queja.create({
    data: {
      ...queja,
      evidencias: { create: evidencias.map((archivoId, orden) => ({ archivoId, orden })) },
      ...(identidad && { identidadProtegida: { create: identidad } }),
    },
    include: conEvidencias,
  });
}

/** Las quejas de una persona: las que llevan su nombre y las anónimas cuyo hash es el suyo. */
export async function quejasDe(denuncianteId: string, hashDenunciante: string) {
  return prisma.queja.findMany({
    where: { OR: [{ denuncianteId }, { identidadProtegida: { hashDenunciante } }] },
    orderBy: [{ fechaRegistro: "desc" }, { numero: "desc" }],
    include: conEvidencias,
  });
}

export async function listarQuejas(estados?: EstadoQueja[]) {
  return prisma.queja.findMany({
    where: estados && { estado: { in: estados } },
    orderBy: [{ fechaRegistro: "desc" }, { numero: "desc" }],
    include: conEvidencias,
  });
}

export async function contarPorEstado() {
  const filas = await prisma.queja.groupBy({ by: ["estado"], _count: { _all: true } });
  return Object.fromEntries(filas.map((f) => [f.estado, f._count._all])) as Partial<
    Record<EstadoQueja, number>
  >;
}

/** La queja con todo lo que la directiva necesita para gestionarla. */
export async function buscarParaGestion(id: string) {
  return prisma.queja.findUnique({
    where: { id },
    include: {
      ...conEvidencias,
      evidencias: { orderBy: { orden: "asc" }, include: { archivo: true } },
      identidadProtegida: true,
    },
  });
}

/** Cambia la queja solo si sigue en el estado esperado: dos personas no la deciden a la vez. */
export async function cambiarSiSigueEn(
  tx: Transaccion,
  id: string,
  estado: EstadoQueja,
  datos: Prisma.QuejaUpdateManyMutationInput,
) {
  const { count } = await tx.queja.updateMany({ where: { id, estado }, data: datos });
  return count === 1;
}
