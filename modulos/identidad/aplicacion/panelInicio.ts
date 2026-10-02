// @HU-GAR-19
import { contarNoLeidas } from "@/compartido/notificaciones/centro";
import { primerNombre } from "@/compartido/fechas";
import { direccion } from "@/modulos/identidad/dominio/predio";
import { buscarConVivienda } from "@/modulos/identidad/infraestructura/repositorioEquipo";
import type { SesionDto } from "./sesion";

/**
 * Lo que M1 aporta al panel de inicio (HU-GAR-19): a quién saluda, su vivienda y sus avisos sin
 * leer. La cuota, la próxima asamblea y los reportes los agregan M3, M4 y M5 al componer la página.
 * Se lee en cada carga, así refleja el último cambio (CA3).
 */
export async function bloqueDeIdentidad(sesion: SesionDto) {
  const [persona, avisosSinLeer] = await Promise.all([
    buscarConVivienda({ id: sesion.usuarioId }),
    contarNoLeidas(sesion.usuarioId),
  ]);
  const residencia = persona?.residencias[0];
  return {
    nombre: primerNombre(sesion.nombreCompleto),
    vivienda: residencia ? direccion(residencia.predio) : null,
    avisosSinLeer,
  };
}
