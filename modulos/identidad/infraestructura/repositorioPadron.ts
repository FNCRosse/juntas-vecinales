import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import { Prisma } from "@/compartido/bd/generado/client";
import type { PersonaNueva } from "@/modulos/identidad/dominio/empadronamiento";
import type { DatosPredio } from "@/modulos/identidad/dominio/predio";

const RESIDENCIAS_VIGENTES = { where: { fechaFin: null }, include: { usuario: true } } as const;

/** El predio de ese lote con su titular vigente, si ya está en el padrón. */
export async function buscarPredioPorLote(manzana: string, lote: string) {
  return prisma.predio.findUnique({
    where: { manzana_lote: { manzana, lote } },
    include: { residencias: { where: { fechaFin: null, relacion: "TITULAR" }, include: { usuario: true } } },
  });
}

/** Las personas que ya tienen alguno de esos DNI, con el predio donde viven hoy. */
export async function buscarPersonasPorDni(dnis: string[]) {
  return prisma.usuario.findMany({
    where: { dni: { in: dnis } },
    include: { residencias: { where: { fechaFin: null }, include: { predio: true } } },
  });
}

/** Crea el predio, sus residentes (rol VECINO) y sus residencias en la transacción del caso de uso. */
export async function crearVivienda(tx: Transaccion, predio: DatosPredio, personas: PersonaNueva[]) {
  const { id: predioId } = await tx.predio.create({ data: predio });
  const usuarios = [];
  for (const persona of personas) {
    const usuario = await tx.usuario.create({
      data: {
        nombreCompleto: persona.nombreCompleto,
        dni: persona.dni,
        telefonoWhatsApp: persona.cuentaPropia ? persona.telefono : null,
        roles: ["VECINO"],
        residencias: { create: { predioId, relacion: persona.relacion } },
      },
    });
    usuarios.push(usuario);
  }
  return { predioId, usuarios };
}

/** Un lote o un DNI que otra petición guardó entre la revisión y el guardado. */
export function esDuplicado(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export type FiltrosPadron = { texto?: string; manzana?: string };

export async function listarPredios({ texto, manzana }: FiltrosPadron) {
  const condiciones: Prisma.PredioWhereInput[] = [];
  if (manzana) condiciones.push({ manzana });
  if (texto) {
    const lote = texto.match(/^(?:mz\.?\s*)?([a-z])\s*,?\s*(?:lote\s*)?(\w+)$/i);
    condiciones.push({
      OR: [
        ...(lote ? [{ manzana: lote[1].toUpperCase(), lote: lote[2] }] : []),
        {
          residencias: {
            some: {
              fechaFin: null,
              usuario: {
                OR: [{ nombreCompleto: { contains: texto, mode: "insensitive" } }, { dni: texto }],
              },
            },
          },
        },
      ],
    });
  }
  return prisma.predio.findMany({
    where: { AND: condiciones },
    include: { residencias: RESIDENCIAS_VIGENTES },
    orderBy: [{ manzana: "asc" }, { creadoEn: "asc" }],
  });
}

export async function contarPadron() {
  const [predios, residentes] = await Promise.all([
    prisma.predio.count(),
    prisma.residencia.count({ where: { fechaFin: null } }),
  ]);
  return { predios, residentes };
}

export async function manzanasDelPadron() {
  const filas = await prisma.predio.findMany({
    distinct: ["manzana"],
    select: { manzana: true },
    orderBy: { manzana: "asc" },
  });
  return filas.map((fila) => fila.manzana);
}

export async function buscarPredio(id: string) {
  return prisma.predio.findUnique({ where: { id }, include: { residencias: RESIDENCIAS_VIGENTES } });
}
