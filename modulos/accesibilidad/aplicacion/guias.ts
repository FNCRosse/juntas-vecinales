// @HU-ACC-10
import { ErrorNoEncontrado } from "@/compartido/errores";
import {
  type AccionGuia,
  aplicarAccion,
  debeOfrecerse,
  estadoEnTexto,
} from "@/modulos/accesibilidad/dominio/onboardingGuiado";
import { RECORRIDOS, type Seccion } from "@/modulos/accesibilidad/dominio/recorridos";
import { guardarGuia, guiasDe } from "@/modulos/accesibilidad/infraestructura/repositorioGuias";

export { RECORRIDOS, type Seccion };
export const ACCIONES_GUIA = ["avanzar", "pausar", "omitir", "completar", "reactivar"] as const;

const esSeccion = (texto: string): texto is Seccion => texto in RECORRIDOS;

/** La guía de una sección con su avance: los pasos, dónde quedó y si se ofrece al entrar (CA1, CA3). */
export async function guiaDeSeccion(usuarioId: string, seccion: string) {
  if (!esSeccion(seccion)) throw new ErrorNoEncontrado();
  const fila = (await guiasDe(usuarioId)).find((g) => g.seccion === seccion) ?? null;
  const recorrido = RECORRIDOS[seccion];
  return {
    seccion,
    nombre: recorrido.nombre,
    href: recorrido.href,
    pasos: recorrido.pasos,
    estado: fila?.estado ?? null,
    paso: fila?.paso ?? 0,
    ofrecer: debeOfrecerse(fila?.estado ?? null),
  };
}
export type GuiaDto = Awaited<ReturnType<typeof guiaDeSeccion>>;

/** "Guías de uso" del panel de ayuda (CA2): cada sección con su estado en palabras. */
export async function guiasDeUso(usuarioId: string) {
  const filas = await guiasDe(usuarioId);
  return (Object.keys(RECORRIDOS) as Seccion[]).map((seccion) => {
    const fila = filas.find((g) => g.seccion === seccion);
    return {
      seccion,
      nombre: RECORRIDOS[seccion].nombre,
      estado: estadoEnTexto(fila?.estado ?? null, fila?.paso ?? 0, RECORRIDOS[seccion].pasos.length),
    };
  });
}

/** Avanzar, pausar, omitir, completar o volver a activar la guía (CA2); queda guardado en la cuenta (CA3). */
export async function registrarAccionDeGuia(
  usuarioId: string,
  seccion: string,
  accion: AccionGuia,
  paso?: number,
) {
  if (!esSeccion(seccion)) throw new ErrorNoEncontrado();
  const nuevo = aplicarAccion(accion, RECORRIDOS[seccion].pasos.length, paso);
  await guardarGuia(usuarioId, seccion, nuevo.estado, nuevo.paso);
  return guiaDeSeccion(usuarioId, seccion);
}
