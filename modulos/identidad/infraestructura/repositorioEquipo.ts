import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import type { NombreRol } from "@/compartido/bd/generado/client";
import type { PropositoEnlace } from "@/modulos/identidad/dominio/magicLink";

const ROLES_DEL_EQUIPO: NombreRol[] = ["DIRECTIVA", "DIRECTIVO_MEDIADOR", "VIGILANTE", "ADMINISTRADOR"];

/** Cuentas activas con un rol de equipo, con su último uso y su vivienda si son vecinos. */
export async function listarMiembros() {
  return prisma.usuario.findMany({
    where: { estado: "ACTIVA", roles: { hasSome: ROLES_DEL_EQUIPO } },
    include: {
      credencial: { select: { usuarioId: true } },
      sesiones: { orderBy: { ultimoUsoEn: "desc" }, take: 1, select: { ultimoUsoEn: true } },
      residencias: { where: { fechaFin: null }, include: { predio: true } },
    },
    orderBy: { nombreCompleto: "asc" },
  });
}

export async function buscarConVivienda(where: { dni: string } | { id: string }) {
  return prisma.usuario.findFirst({
    where: { ...where, estado: "ACTIVA" },
    include: { residencias: { where: { fechaFin: null }, include: { predio: true } } },
  });
}

export async function guardarRoles(tx: Transaccion, usuarioId: string, roles: NombreRol[]) {
  await tx.usuario.update({ where: { id: usuarioId }, data: { roles } });
}

/** Cierra todas las sesiones abiertas de la persona, en todos sus dispositivos. */
export async function revocarSesionesDe(tx: Transaccion, usuarioId: string, ahora: Date) {
  await tx.sesion.updateMany({ where: { usuarioId, revocadaEn: null }, data: { revocadaEn: ahora } });
}

export async function anularEnlacesDe(
  tx: Transaccion,
  usuarioId: string,
  proposito: PropositoEnlace,
  ahora: Date,
) {
  await tx.magicLink.updateMany({
    where: { usuarioId, proposito, usadoEn: null, anuladoEn: null },
    data: { anuladoEn: ahora },
  });
}

export async function desvincularCuenta(tx: Transaccion, usuarioId: string) {
  await tx.usuario.update({ where: { id: usuarioId }, data: { estado: "DESVINCULADA" } });
}
