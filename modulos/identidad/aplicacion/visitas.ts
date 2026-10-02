// @HU-GAR-04 @HU-GAR-05
import type { Transaccion } from "@/compartido/bd/cliente";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { rangoHorario } from "@/compartido/fechas";
import { direccion } from "@/modulos/identidad/dominio/predio";
import {
  codigoDeVisita,
  type DatosVisita,
  estaEnLaLista,
  prepararVisita,
} from "@/modulos/identidad/dominio/visita";
import {
  anular,
  crearVisita,
  guardarEstadoGarita,
  visitaDelPredio,
  visitasDelPredio,
  viviendaDe,
} from "@/modulos/identidad/infraestructura/repositorioVisitas";
import type { SesionDto } from "./sesion";

export const MENSAJE_VISITAS_EN_PAUSA =
  "Por ahora no puede registrar visitas nuevas: tiene 8 semanas pendientes. Sus visitas igual pueden entrar: el vigilante le preguntará a usted.";

async function miVivienda(sesion: SesionDto) {
  const predio = await viviendaDe(sesion.usuarioId);
  if (!predio)
    throw new ErrorNoEncontrado("No encontramos su vivienda en el padrón. Pida ayuda a la administración.");
  return predio;
}

const aDto = (v: Awaited<ReturnType<typeof crearVisita>>) => ({
  id: v.id,
  codigo: codigoDeVisita(v.numero),
  nombre: v.nombre,
  cuando: rangoHorario(v.desde, v.hasta),
  vehiculo: v.conVehiculo ? (v.placa ? `Auto ${v.placa}` : "En vehículo, sin placa anotada") : "A pie",
  estado: v.estado,
  llegoEn: v.llegoEn?.toISOString() ?? null,
});

/**
 * Mis visitas (VEC-GAR-01): las programadas que siguen en la lista de la garita y las que llegaron en
 * la última semana. Dice si puede registrar nuevas (HU-GAR-04 CA2).
 */
export async function misVisitas(sesion: SesionDto, ahora = new Date()) {
  const predio = await miVivienda(sesion);
  const visitas = await visitasDelPredio(predio.id, new Date(ahora.getTime() - 7 * 24 * 3_600_000));
  return {
    vivienda: direccion(predio),
    puedeRegistrar: predio.estadoGarita !== "ROJO",
    programadas: visitas.filter((v) => estaEnLaLista(v, ahora)).map(aDto),
    llegaron: visitas
      .filter((v) => v.estado === "LLEGO")
      .reverse()
      .map(aDto),
  };
}

/**
 * Registra una visita en la lista blanca de la garita (HU-GAR-04 CA1 y CA3). Un vecino con 8 semanas
 * pendientes no puede (CA2): sus visitas pasan por la pregunta del vigilante.
 */
export async function registrarVisita(sesion: SesionDto, datos: DatosVisita, ahora = new Date()) {
  const predio = await miVivienda(sesion);
  if (predio.estadoGarita === "ROJO") throw new ErrorReglaNegocio(MENSAJE_VISITAS_EN_PAUSA);
  const { errores, visita } = prepararVisita(datos, ahora);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);
  const creada = await crearVisita({ ...visita, predioId: predio.id, registradaPor: sesion.usuarioId });
  return { ...aDto(creada), registradaEn: creada.creadaEn.toISOString(), vivienda: direccion(predio) };
}

/** Para la pantalla de confirmación (VEC-GAR-04): solo una visita de su casa que siga en la lista. */
export async function verVisita(sesion: SesionDto, id: string, ahora = new Date()) {
  const predio = await miVivienda(sesion);
  const visita = await visitaDelPredio(id, predio.id);
  if (!visita || !estaEnLaLista(visita, ahora)) throw new ErrorNoEncontrado();
  return aDto(visita);
}

/** Anula una visita y la saca de la lista de la garita al instante (HU-GAR-05 CA2). */
export async function anularVisita(sesion: SesionDto, id: string, ahora = new Date()) {
  await verVisita(sesion, id, ahora);
  return aDto(await anular(id, ahora));
}

/**
 * Puerto para M5 (modulos/identidad/CLAUDE.md, Garita): pasa el semáforo del predio a ROJO cuando la
 * deuda llega a 8 semanas y a VERDE cuando se pone al día, en la transacción de M5.
 */
export async function actualizarEstadoMorosidad(predioId: string, estado: "VERDE" | "ROJO", tx: Transaccion) {
  await guardarEstadoGarita(tx, predioId, estado);
}
