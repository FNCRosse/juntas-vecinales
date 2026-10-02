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
