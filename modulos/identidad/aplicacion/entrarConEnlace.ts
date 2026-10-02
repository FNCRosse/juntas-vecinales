// @HU-GAR-02
import { prisma } from "@/compartido/bd/cliente";
import { hashDeToken, nuevoToken } from "@/compartido/claves";
import { ErrorConflicto } from "@/compartido/errores";
import { primerNombre } from "@/compartido/fechas";
import { pasarPerfilALaCuenta } from "@/modulos/accesibilidad/aplicacion/pasarPerfilALaCuenta";
import { type EstadoEnlace, estadoDelEnlace } from "@/modulos/identidad/dominio/magicLink";
import { direccion } from "@/modulos/identidad/dominio/predio";
import {
  bloquearEnlace,
  buscarEnlacePorHash,
  marcarEnlaceUsado,
} from "@/modulos/identidad/infraestructura/repositorioEnlaces";
import { crearSesion } from "@/modulos/identidad/infraestructura/repositorioSesiones";
import { aSesionDto, type SesionDto } from "./sesion";

export const MENSAJE_ENLACE_NO_SIRVE =
  "Este enlace ya no sirve: se usó, venció o le enviamos uno más nuevo. Pida un enlace nuevo a la administración.";

export type Bienvenida =
  | { estado: "VIGENTE"; nombre: string; direccion: string | null }
  | { estado: Exclude<EstadoEnlace, "VIGENTE"> };

/**
 * Lo que muestra la pantalla del enlace (VEC-ACC-01) sin gastarlo: abrir la página no inicia sesión,
 * porque las vistas previas de WhatsApp también la abren. Se entra con el botón (POST).
 */
export async function consultarEnlace(token: string, ahora = new Date()): Promise<Bienvenida> {
  const enlace = await buscarEnlacePorHash(hashDeToken(token));
  if (!enlace || enlace.usuario.estado !== "ACTIVA") return { estado: "VENCIDO" };
  const estado = estadoDelEnlace(enlace, ahora);
  if (estado !== "VIGENTE") return { estado };
  const residencia = enlace.usuario.residencias[0];
  return {
    estado,
    nombre: primerNombre(enlace.usuario.nombreCompleto),
    direccion: residencia ? direccion(residencia.predio) : null,
  };
}

/** A dónde sigue el vecino después de entrar: la política, si falta aceptarla, o su inicio. */
export function siguientePaso(sesion: SesionDto) {
  return sesion.politicaAceptada ? "/" : "/entrar/privacidad";
}

/**
 * Canjea el enlace (HU-GAR-02 CA1, R-01): vigente y sin usar, inicia sesión sin pedir clave y queda
 * usado en la misma transacción. Al entrar, el perfil de accesibilidad pasa a la cuenta (HU-ACC-01).
 */
export async function canjearEnlace(
  token: string,
  perfilDispositivo: string | undefined,
  ahora = new Date(),
): Promise<{ token: string; sesion: SesionDto; destino: string }> {
  const sesionNueva = nuevoToken();
  const usuario = await prisma.$transaction(async (tx) => {
    const enlace = await bloquearEnlace(tx, hashDeToken(token));
    if (!enlace || estadoDelEnlace(enlace, ahora) !== "VIGENTE")
      throw new ErrorConflicto(MENSAJE_ENLACE_NO_SIRVE);
    const usuario = await tx.usuario.findUniqueOrThrow({ where: { id: enlace.usuarioId } });
    if (usuario.estado !== "ACTIVA") throw new ErrorConflicto(MENSAJE_ENLACE_NO_SIRVE);
    await marcarEnlaceUsado(tx, enlace.id, ahora);
    await crearSesion(usuario.id, sesionNueva.hash, tx);
    return usuario;
  });
  await pasarPerfilALaCuenta(usuario.id, perfilDispositivo);
  const sesion = aSesionDto(usuario);
  return { token: sesionNueva.token, sesion, destino: siguientePaso(sesion) };
}
