import { prisma } from "@/compartido/bd/cliente";
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

/** Inserta el perfil si no tiene id; si lo tiene, lo actualiza. Devuelve el perfil guardado. */
export async function guardarPerfil(perfil: PerfilAccesibilidad) {
  const { id, ...datos } = perfil.aDatos();
  const fila = id
    ? await prisma.perfilAccesibilidad.update({ where: { id }, data: datos, select: columnas })
    : await prisma.perfilAccesibilidad.create({ data: datos, select: columnas });
  return PerfilAccesibilidad.reconstruir(fila);
}
