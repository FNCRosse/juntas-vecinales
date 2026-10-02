import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import { PerfilAccesibilidad } from "@/modulos/accesibilidad/dominio/perfilAccesibilidad";

const columnas = {
  id: true,
  usuarioId: true,
  modoSeniorActivo: true,
  escalaTipografica: true,
  altoContrasteActivo: true,
  sintesisVozActiva: true,
  confirmacionEnDosPasosActiva: true,
  areaTactilAmpliada: true,
} as const;

export async function buscarPerfilPorId(id: string) {
  const fila = await prisma.perfilAccesibilidad.findUnique({ where: { id }, select: columnas });
  return fila && PerfilAccesibilidad.reconstruir(fila);
}

export async function buscarPerfilPorUsuario(usuarioId: string) {
  const fila = await prisma.perfilAccesibilidad.findUnique({ where: { usuarioId }, select: columnas });
  return fila && PerfilAccesibilidad.reconstruir(fila);
}

/** Pasa a la cuenta un perfil del dispositivo que todavía no es de nadie. */
export async function asignarPerfilSinDueno(perfilId: string, usuarioId: string) {
  await prisma.perfilAccesibilidad.updateMany({
    where: { id: perfilId, usuarioId: null },
    data: { usuarioId },
  });
}

/** Inserta el perfil si no tiene id; si lo tiene, lo actualiza. Devuelve el perfil guardado. */
export async function guardarPerfil(perfil: PerfilAccesibilidad) {
  const { id, ...datos } = perfil.aDatos();
  const fila = id
    ? await prisma.perfilAccesibilidad.update({ where: { id }, data: datos, select: columnas })
    : await prisma.perfilAccesibilidad.create({ data: datos, select: columnas });
  return PerfilAccesibilidad.reconstruir(fila);
}

/** Cancelación aprobada (HU-GAR-14 CA3): el perfil de la cuenta se borra. */
export async function borrarPerfilDe(tx: Transaccion, usuarioId: string) {
  await tx.perfilAccesibilidad.deleteMany({ where: { usuarioId } });
}
