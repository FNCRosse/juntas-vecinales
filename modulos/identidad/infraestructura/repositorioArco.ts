import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import type { EstadoArco, Prisma, TipoArco } from "@/compartido/bd/generado/client";

const CON_VECINO = {
  usuario: {
    include: { residencias: { where: { fechaFin: null }, include: { predio: true }, take: 1 } },
  },
} as const;

export async function crearSolicitud(tx: Transaccion, datos: Prisma.SolicitudArcoUncheckedCreateInput) {
  return tx.solicitudArco.create({ data: datos });
}

export async function solicitudesDelVecino(usuarioId: string) {
  return prisma.solicitudArco.findMany({ where: { usuarioId }, orderBy: { creadaEn: "desc" }, take: 10 });
}

export async function pendienteDelMismoCampo(
  usuarioId: string,
  campo: Prisma.SolicitudArcoWhereInput["campo"],
) {
  return prisma.solicitudArco.findFirst({
    where: { usuarioId, estado: "PENDIENTE", tipo: "RECTIFICACION", campo },
  });
}

export async function solicitudesParaLaBandeja(tipo?: TipoArco) {
  return prisma.solicitudArco.findMany({
    where: tipo ? { tipo } : {},
    include: CON_VECINO,
    orderBy: [{ creadaEn: "desc" }],
    take: 100,
  });
}

export async function solicitudConVecino(id: string) {
  return prisma.solicitudArco.findUnique({ where: { id }, include: CON_VECINO });
}

export async function contarPendientes() {
  return prisma.solicitudArco.findMany({
    where: { estado: "PENDIENTE" },
    select: { tipo: true, creadaEn: true },
  });
}

/** Cierra la solicitud solo si sigue pendiente: dos administradores no la resuelven dos veces. */
export async function cerrarSolicitud(
  tx: Transaccion,
  id: string,
  datos: {
    estado: EstadoArco;
    resueltaEn: Date;
    resueltaPor: string;
    motivoResolucion: string | null;
    verificacion: string | null;
  },
) {
  const { count } = await tx.solicitudArco.updateMany({ where: { id, estado: "PENDIENTE" }, data: datos });
  return count === 1;
}

export async function nombreDeUsuario(id: string | null) {
  if (!id) return null;
  return (
    (await prisma.usuario.findUnique({ where: { id }, select: { nombreCompleto: true } }))?.nombreCompleto ??
    null
  );
}

/**
 * Borra o anonimiza los datos personales que guarda identidad (HU-GAR-14 CA3): la persona queda sin
 * nombre, DNI, teléfono, vivienda, clave, sesiones, enlaces ni avisos. Se conservan su id (para los
 * registros contables y la auditoría) y sus solicitudes, sin los valores que traían.
 */
export async function anonimizarIdentidad(
  tx: Transaccion,
  usuarioId: string,
  datos: { nombre: string; dni: string },
  ahora: Date,
) {
  await tx.usuario.update({
    where: { id: usuarioId },
    data: {
      nombreCompleto: datos.nombre,
      dni: datos.dni,
      telefonoWhatsApp: null,
      estado: "DESVINCULADA",
      roles: [],
      anonimizadaEn: ahora,
    },
  });
  await tx.residencia.updateMany({ where: { usuarioId, fechaFin: null }, data: { fechaFin: ahora } });
  await tx.sesion.updateMany({ where: { usuarioId, revocadaEn: null }, data: { revocadaEn: ahora } });
  await tx.credencialRespaldo.deleteMany({ where: { usuarioId } });
  await tx.magicLink.deleteMany({ where: { usuarioId } });
  await tx.notificacion.deleteMany({ where: { destinatarioId: usuarioId } });
  await tx.avisoEnCola.deleteMany({ where: { destinatarioId: usuarioId } });
  await tx.preferenciaAviso.deleteMany({ where: { usuarioId } });
  await tx.solicitudArco.updateMany({
    where: { usuarioId, tipo: "RECTIFICACION" },
    data: { valorAnterior: null, valorNuevo: null, detalle: null },
  });
}

export async function ultimaOposicion(usuarioId: string) {
  return prisma.solicitudArco.findFirst({
    where: { usuarioId, tipo: "OPOSICION" },
    orderBy: { numero: "desc" },
  });
}

export async function cancelacionPendiente(usuarioId: string) {
  return prisma.solicitudArco.findFirst({ where: { usuarioId, tipo: "CANCELACION", estado: "PENDIENTE" } });
}

export async function administradoresActivos() {
  return prisma.usuario.findMany({ where: { estado: "ACTIVA", roles: { has: "ADMINISTRADOR" } } });
}
