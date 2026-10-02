// @HU-GAR-24
import { claveCoincide, nuevoToken } from "@/compartido/claves";
import { ErrorEnPausa, ErrorNoAutenticado } from "@/compartido/errores";
import { MAX_FALLOS, MINUTOS_DE_PAUSA } from "@/modulos/identidad/dominio/credencialRespaldo";
import {
  buscarUsuarioConCredencialPorDni,
  guardarEstadoCredencial,
} from "@/modulos/identidad/infraestructura/repositorioUsuarios";
import { pasarPerfilALaCuenta } from "@/modulos/accesibilidad/aplicacion/pasarPerfilALaCuenta";
import { crearSesion } from "@/modulos/identidad/infraestructura/repositorioSesiones";
import { aSesionDto, type SesionDto } from "./sesion";

export const MENSAJE_NO_COINCIDE = "El DNI o la clave no coinciden. Revíselos y vuelva a intentarlo.";
export const MENSAJE_EN_PAUSA = `La clave no coincidió ${MAX_FALLOS} veces seguidas. Para cuidar su cuenta, la entrada con clave queda en pausa por ${MINUTOS_DE_PAUSA} minutos.`;

// Para que la respuesta tarde lo mismo exista o no el DNI.
const CREDENCIAL_FICTICIA = { sal: "sal-ficticia", hash: "AAAA" };

/**
 * Entrada con DNI y clave: la de respaldo del vecino y la de las cuentas internas (WCAG 3.3.8:
 * se puede pegar y autocompletar). No revela si el DNI existe.
 */
export async function iniciarSesionConClave(
  datos: { dni: string; clave: string },
  ahora = new Date(),
  perfilDispositivo?: string,
): Promise<{ token: string; sesion: SesionDto }> {
  const encontrado = await buscarUsuarioConCredencialPorDni(datos.dni);
  if (!encontrado || !encontrado.credencial || encontrado.usuario.estado !== "ACTIVA") {
    await claveCoincide(datos.clave, CREDENCIAL_FICTICIA);
    throw new ErrorNoAutenticado(MENSAJE_NO_COINCIDE);
  }
  const { usuario, credencial } = encontrado;
  if (credencial.dominio.estaEnPausa(ahora)) throw new ErrorEnPausa(MENSAJE_EN_PAUSA);

  if (!(await claveCoincide(datos.clave, credencial))) {
    credencial.dominio.registrarFallo(ahora);
    await guardarEstadoCredencial(usuario.id, credencial.dominio);
    if (credencial.dominio.estaEnPausa(ahora)) throw new ErrorEnPausa(MENSAJE_EN_PAUSA);
    throw new ErrorNoAutenticado(MENSAJE_NO_COINCIDE);
  }

  credencial.dominio.registrarExito();
  await guardarEstadoCredencial(usuario.id, credencial.dominio);
  const { token, hash } = nuevoToken();
  await crearSesion(usuario.id, hash);
  await pasarPerfilALaCuenta(usuario.id, perfilDispositivo);
  return {
    token,
    sesion: aSesionDto(usuario),
  };
}
