import { prisma } from "@/compartido/bd/cliente";
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
