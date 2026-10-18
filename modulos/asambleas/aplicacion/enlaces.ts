// @HU-ASA-10 @HU-ASA-11
import { ErrorNoEncontrado, ErrorReglaNegocio } from "@/compartido/errores";
import { fechaLarga } from "@/compartido/fechas";
import {
  buscarActividad,
  listarActividades,
} from "@/modulos/asambleas/infraestructura/repositorioActividades";
import {
  buscarAsamblea,
  listarAsambleas,
} from "@/modulos/asambleas/infraestructura/repositorioConvocatorias";

/** El día en Lima, «2026-12-14»: lo que piden los formularios de actas y balances de transparencia. */
const diaEnLima = (fecha: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(fecha);

type Asamblea = NonNullable<Awaited<ReturnType<typeof buscarAsamblea>>>;

/**
 * Sin quórum definitivo no hay votos ni acuerdos (HU-ASA-07 CA3): una asamblea solo admite un acta con acuerdos
 * si las votaciones se abrieron en la puerta. Una sesión informativa nunca los admite.
 */
const admiteAcuerdos = (a: Asamblea) =>
  a.estado !== "INFORMATIVA" && a.asamblea?.votacionesAbiertasEn != null;

/** Las asambleas que ya empezaron, para elegir de cuál es el acta (DIR-ASA-10), con las que admiten acuerdos. */
export async function asambleasParaActa(ahora = new Date()) {
  return (await listarAsambleas())
    .filter((a) => a.fechaHora <= ahora)
    .reverse()
    .map((a) => ({
      id: a.id,
      titulo: a.titulo,
      dia: diaEnLima(a.fechaHora),
      fecha: fechaLarga(a.fechaHora),
      admiteAcuerdos: admiteAcuerdos(a),
    }));
}

/**
 * El día y el título de la asamblea de un acta, y la regla de HU-ASA-07 CA3: si no alcanzó el quórum definitivo
 * no se aceptan acuerdos. M2 la llama antes de publicar el acta.
 */
export async function asambleaDeUnActa(id: string) {
  const asamblea = await buscarAsamblea(id);
  if (!asamblea) throw new ErrorNoEncontrado();
  if (!admiteAcuerdos(asamblea)) {
    throw new ErrorReglaNegocio(
      asamblea.estado === "INFORMATIVA"
        ? "Esa asamblea fue una sesión informativa: no admite acuerdos."
        : "Esa asamblea no tiene el quórum definitivo: no se pueden registrar acuerdos.",
    );
  }
  return { titulo: asamblea.titulo, dia: diaEnLima(asamblea.fechaHora) };
}

/** Las actividades pro fondos que ya se hicieron, para elegir de cuál es el balance (DIR-ASA-12). */
export async function actividadesParaBalance(ahora = new Date()) {
  return (await listarActividades())
    .filter((a) => a.fechaHora <= ahora)
    .reverse()
    .map((a) => ({
      id: a.id,
      nombre: a.titulo,
      dia: diaEnLima(a.fechaHora),
      fecha: fechaLarga(a.fechaHora),
    }));
}

/** El nombre y el día de la actividad de un balance; falla si no existe. */
export async function actividadDeUnBalance(id: string) {
  const actividad = await buscarActividad(id);
  if (!actividad) throw new ErrorNoEncontrado();
  return { nombre: actividad.titulo, dia: diaEnLima(actividad.fechaHora) };
}
