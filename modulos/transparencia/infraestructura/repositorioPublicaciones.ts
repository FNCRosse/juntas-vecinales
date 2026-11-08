import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { NivelUrgencia } from "@/compartido/bd/generado/client";

// Con su texto y, si se corrigió, cuál lo corrige (una publicación no cambia: se corrige con otra, docs/DATOS.md §3).
const conComunicado = {
  comunicado: true,
  correcciones: { select: { id: true }, orderBy: { fechaPublicacion: "asc" }, take: 1 },
} as const;

export async function buscarPorIdOperacion(idOperacion: string) {
  return prisma.publicacion.findUnique({ where: { idOperacion }, include: conComunicado });
}

export async function crearComunicado(
  tx: Transaccion,
  datos: {
    idOperacion: string;
    titulo: string;
    cuerpo: string;
    urgencia: NivelUrgencia;
    autorId: string;
    autor: string;
    fechaPublicacion: Date;
    corrigeAId?: string | null;
  },
) {
  const { cuerpo, urgencia, ...publicacion } = datos;
  return tx.publicacion.create({
    data: { ...publicacion, tipo: "COMUNICADO", comunicado: { create: { cuerpo, urgencia } } },
    include: conComunicado,
  });
}

/** Un comunicado publicado, o null. */
export async function buscarComunicado(id: string) {
  return prisma.publicacion.findFirst({ where: { id, tipo: "COMUNICADO" }, include: conComunicado });
}

/** Los comunicados publicados hasta ahora: el orden del feed lo da el dominio. */
export async function listarComunicados() {
  return prisma.publicacion.findMany({
    where: { tipo: "COMUNICADO" },
    include: conComunicado,
    orderBy: { fechaPublicacion: "desc" },
    take: 100,
  });
}

const conActa = { acta: true } as const;

export async function buscarActaPorIdOperacion(idOperacion: string) {
  return prisma.publicacion.findFirst({ where: { idOperacion, tipo: "ACTA" }, include: conActa });
}

export async function crearActa(
  tx: Transaccion,
  datos: {
    idOperacion: string;
    titulo: string;
    fechaAsamblea: Date;
    convocatoriaId: string | null;
    acuerdos: string[];
    compromisos: string[];
    conclusiones: string;
    autorId: string;
    autor: string;
    fechaPublicacion: Date;
  },
) {
  const { fechaAsamblea, convocatoriaId, acuerdos, compromisos, conclusiones, ...publicacion } = datos;
  return tx.publicacion.create({
    data: {
      ...publicacion,
      tipo: "ACTA",
      acta: { create: { fechaAsamblea, convocatoriaId, acuerdos, compromisos, conclusiones } },
    },
    include: conActa,
  });
}

export async function buscarActa(id: string) {
  return prisma.publicacion.findFirst({ where: { id, tipo: "ACTA" }, include: conActa });
}

export async function listarActas() {
  return prisma.publicacion.findMany({
    where: { tipo: "ACTA" },
    include: conActa,
    orderBy: { fechaPublicacion: "desc" },
    take: 100,
  });
}

const conBalance = { balance: { include: { egresos: { orderBy: { orden: "asc" } } } } } as const;

export async function buscarBalancePorIdOperacion(idOperacion: string) {
  return prisma.publicacion.findFirst({ where: { idOperacion, tipo: "BALANCE" }, include: conBalance });
}

export async function crearBalance(
  tx: Transaccion,
  datos: {
    idOperacion: string;
    titulo: string;
    fechaActividad: Date;
    convocatoriaId: string | null;
    ingresosVirtuales: number;
    ingresosEnPuerta: number;
    egresos: { concepto: string; monto: number; archivoId: string }[];
    autorId: string;
    autor: string;
    fechaPublicacion: Date;
  },
) {
  const { fechaActividad, convocatoriaId, ingresosVirtuales, ingresosEnPuerta, egresos, ...publicacion } =
    datos;
  return tx.publicacion.create({
    data: {
      ...publicacion,
      tipo: "BALANCE",
      balance: {
        create: {
          fechaActividad,
          convocatoriaId,
          ingresosVirtuales,
          ingresosEnPuerta,
          egresos: { create: egresos.map((e, orden) => ({ ...e, orden })) },
        },
      },
    },
    include: conBalance,
  });
}

export async function buscarBalance(id: string) {
  return prisma.publicacion.findFirst({ where: { id, tipo: "BALANCE" }, include: conBalance });
}

export async function listarBalances() {
  return prisma.publicacion.findMany({
    where: { tipo: "BALANCE" },
    include: conBalance,
    orderBy: { fechaPublicacion: "desc" },
    take: 100,
  });
}

/** El balance publicado de una actividad pro fondos de la plataforma, si ya lo tiene (una por actividad). */
export async function balanceDeConvocatoria(convocatoriaId: string) {
  return prisma.publicacion.findFirst({
    where: { tipo: "BALANCE", balance: { is: { convocatoriaId } } },
    include: conBalance,
    orderBy: { fechaPublicacion: "asc" },
  });
}
