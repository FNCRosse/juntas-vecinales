import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import type { EstadoVisita, ModoAcceso, Prisma, TipoRegistroAcceso } from "@/compartido/bd/generado/client";

const VIVEN = {
  residencias: { where: { fechaFin: null }, include: { usuario: true } },
  vehiculos: true,
} as const;

export async function prediosPorPlaca(placa: string) {
  return prisma.predio.findMany({ where: { vehiculos: { some: { placa } } }, include: VIVEN });
}

/** Quien tiene ese DNI, viva o no en el barrio (para decir "ya no vive aquí"). */
export async function personaPorDni(dni: string) {
  return prisma.usuario.findUnique({
    where: { dni },
    include: { residencias: { where: { fechaFin: null }, include: { predio: { include: VIVEN } } } },
  });
}

/** Predios donde vive alguien con ese nombre, o esa casa ("Mz. C lote 7" o "C 7"). */
export async function prediosPorNombreOCasa(texto: string) {
  const casa = texto.match(/^(?:mz\.?\s*)?([a-z])\s*[,-]?\s*(?:lote\s*)?(\d{1,4}[a-z]?)?$/i);
  const condiciones: Prisma.PredioWhereInput[] = [
    {
      residencias: {
        some: { fechaFin: null, usuario: { nombreCompleto: { contains: texto, mode: "insensitive" } } },
      },
    },
  ];
  if (casa) {
    condiciones.push({
      manzana: casa[1].toUpperCase(),
      ...(casa[2] ? { lote: casa[2].toUpperCase() } : {}),
    });
  }
  return prisma.predio.findMany({
    where: { OR: condiciones },
    include: VIVEN,
    take: 8,
    orderBy: [{ manzana: "asc" }],
  });
}

export async function predioConResidentes(id: string) {
  return prisma.predio.findUnique({ where: { id }, include: VIVEN });
}

/** Todo lo que necesita la tablet sin internet: predios con residentes, su estado y sus placas. */
export async function padronParaGarita() {
  return prisma.predio.findMany({
    where: { residencias: { some: { fechaFin: null } } },
    include: VIVEN,
  });
}

export async function anotarAcceso(
  tx: Transaccion,
  datos: {
    fecha: Date;
    tipo: TipoRegistroAcceso;
    modo: ModoAcceso;
    quien: string;
    vivienda: string;
    vigilanteId: string;
    placa?: string | null;
    predioId?: string | null;
    visitaId?: string | null;
    entradaId?: string | null;
    detalle?: string | null;
  },
) {
  return tx.registroAcceso.create({ data: datos });
}

export async function registrosEntre(desde: Date, hasta: Date) {
  return prisma.registroAcceso.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
    orderBy: { fecha: "desc" },
  });
}

/** Entradas sin su salida: quién sigue dentro del barrio. */
export async function entradasSinSalida(desde: Date, hasta: Date) {
  const entradas = await prisma.registroAcceso.findMany({
    where: { tipo: "ENTRADA", modo: { not: "NO_ENTRO" }, fecha: { gte: desde, lte: hasta } },
    orderBy: { fecha: "asc" },
  });
  const salidas = await prisma.registroAcceso.findMany({
    where: { tipo: "SALIDA", entradaId: { in: entradas.map((e) => e.id) }, fecha: { lte: hasta } },
    select: { entradaId: true },
  });
  const salieron = new Set(salidas.map((s) => s.entradaId));
  return entradas.filter((e) => !salieron.has(e.id));
}

export async function buscarRegistro(id: string) {
  return prisma.registroAcceso.findUnique({ where: { id } });
}

export async function salidaDe(entradaId: string) {
  return prisma.registroAcceso.findFirst({ where: { tipo: "SALIDA", entradaId } });
}

/** Una salida por entrada: la restricción única lo garantiza aunque dos tablets marquen a la vez. */
export async function anotarSalida(
  datos: {
    entradaId: string;
    modo: ModoAcceso;
    quien: string;
    vivienda: string;
    placa: string | null;
    vigilanteId: string;
  },
  ahora: Date,
) {
  try {
    return await prisma.registroAcceso.create({
      data: { ...datos, tipo: "SALIDA", fecha: ahora },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return null;
    throw error;
  }
}

export async function visitasParaGarita(desde: Date, hasta: Date) {
  return prisma.visita.findMany({
    where: { desde: { lte: hasta }, hasta: { gte: desde } },
    include: { predio: true },
    orderBy: { desde: "asc" },
  });
}

export async function visitaConPredio(id: string) {
  return prisma.visita.findUnique({ where: { id }, include: { predio: { include: VIVEN } } });
}

export async function crearVisitaNoAnunciada(tx: Transaccion, datos: Prisma.VisitaUncheckedCreateInput) {
  return tx.visita.create({ data: { ...datos, anunciada: false, estado: "ESPERANDO_RESPUESTA" } });
}

/** Cambia el estado solo si sigue en uno de los esperados: la segunda respuesta no pisa a la primera. */
export async function cambiarEstadoVisita(
  tx: Transaccion,
  id: string,
  desde: EstadoVisita[],
  datos: Prisma.VisitaUpdateManyMutationInput,
) {
  const { count } = await tx.visita.updateMany({ where: { id, estado: { in: desde } }, data: datos });
  return count === 1;
}

export async function nombreDeUsuario(id: string) {
  return (await prisma.usuario.findUnique({ where: { id }, select: { nombreCompleto: true } }))
    ?.nombreCompleto;
}

export async function directivaActiva() {
  return prisma.usuario.findMany({ where: { estado: "ACTIVA", roles: { has: "DIRECTIVA" } } });
}
