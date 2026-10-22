import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import { CredencialRespaldo } from "@/modulos/identidad/dominio/credencialRespaldo";

export async function buscarUsuarioConCredencialPorDni(dni: string) {
  const fila = await prisma.usuario.findUnique({ where: { dni }, include: { credencial: true } });
  if (!fila) return null;
  const { credencial, ...usuario } = fila;
  return {
    usuario,
    credencial: credencial && {
      sal: credencial.sal,
      hash: credencial.hash,
      dominio: CredencialRespaldo.reconstruir(credencial),
    },
  };
}

export async function guardarEstadoCredencial(usuarioId: string, credencial: CredencialRespaldo) {
  await prisma.credencialRespaldo.update({ where: { usuarioId }, data: credencial.aDatos() });
}

export async function buscarUsuario(id: string) {
  return prisma.usuario.findUnique({
    where: { id },
    include: { credencial: { select: { usuarioId: true } } },
  });
}

/** Crea o reemplaza la clave de respaldo y deja la entrada con clave sin pausa. */
export async function guardarClave(tx: Transaccion, usuarioId: string, clave: { hash: string; sal: string }) {
  const datos = { ...clave, fallosSeguidos: 0, bloqueadaHasta: null };
  await tx.credencialRespaldo.upsert({
    where: { usuarioId },
    create: { usuarioId, ...datos },
    update: datos,
  });
}

export async function marcarPoliticaAceptada(
  tx: Transaccion,
  usuarioId: string,
  version: string,
  ahora: Date,
) {
  await tx.usuario.update({
    where: { id: usuarioId },
    data: { politicaAceptadaEn: ahora, politicaVersion: version },
  });
}

/** Los vecinos con cuenta activa: a quienes llega un comunicado a toda la comunidad. */
/** Vecinos con vivienda cuyo nombre o DNI coincide con el texto (un mediador que asienta una asistencia). */
export async function vecinosPorNombreODni(texto: string) {
  return prisma.residencia.findMany({
    where: {
      fechaFin: null,
      usuario: {
        OR: [{ nombreCompleto: { contains: texto, mode: "insensitive" } }, { dni: { startsWith: texto } }],
      },
    },
    include: { usuario: true, predio: true },
    take: 8,
    orderBy: { usuario: { nombreCompleto: "asc" } },
  });
}

/** Los predios por su id con quién vive hoy, para nombrarlos en una lista (el pase de lista de una asamblea). */
export async function prediosConResidentes(ids: string[]) {
  return prisma.predio.findMany({
    where: { id: { in: ids } },
    include: {
      residencias: { where: { fechaFin: null }, include: { usuario: true }, orderBy: { fechaInicio: "asc" } },
    },
  });
}

export async function idsDeVecinosActivos(tx: Transaccion) {
  const vecinos = await tx.usuario.findMany({
    where: { estado: "ACTIVA", anonimizadaEn: null, roles: { hasSome: ["VECINO", "VECINO_ADULTO_MAYOR"] } },
    select: { id: true },
  });
  return vecinos.map((v) => v.id);
}

/** Las casas con al menos una unidad de ese rubro de la ocupación (autos, motos, familias…) y quiénes viven en ellas. */
export async function prediosConOcupacion(
  rubro: "familias" | "inquilinos" | "autos" | "motos" | "triciclos" | "negocios",
) {
  return prisma.predio.findMany({
    where: { [rubro]: { gt: 0 } },
    select: {
      id: true,
      residencias: {
        where: { fechaFin: null, usuario: { estado: "ACTIVA", anonimizadaEn: null } },
        select: { usuarioId: true },
      },
    },
  });
}
