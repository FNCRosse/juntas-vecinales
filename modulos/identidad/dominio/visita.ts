// @HU-GAR-04 @HU-GAR-05
// Visita del diagrama 02a: entra a la lista blanca de la garita por 3 horas desde la hora indicada.

export const HORAS_DE_PERMISO = 3;
/** Se puede anunciar una visita que llega hasta 15 minutos antes de ahora (ya está en la puerta). */
const TOLERANCIA_MS = 15 * 60_000;
/** Como máximo, con 60 días de anticipación. */
const MAXIMO_MS = 60 * 24 * 3_600_000;

export type DatosVisita = { nombre: string; dni?: string; desde: Date; conVehiculo: boolean; placa?: string };

/** "V-0311": así se nombra la constancia de una visita. */
export const codigoDeVisita = (numero: number) => `V-${String(numero).padStart(4, "0")}`;

/** Placa en mayúsculas y con guion, como se lee en la garita: "cdf220" → "CDF-220". */
export function normalizarPlaca(placa: string) {
  const limpia = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return limpia.length === 6 ? `${limpia.slice(0, 3)}-${limpia.slice(3)}` : limpia;
}

/** Revisa los datos y calcula hasta cuándo vale el permiso. Devuelve los errores por campo. */
export function prepararVisita(datos: DatosVisita, ahora: Date) {
  const errores: Record<string, string> = {};
  if (!datos.nombre.trim()) errores.nombre = "Falta el nombre de la visita.";
  if (Number.isNaN(datos.desde.getTime())) errores.desde = "Elija la fecha y la hora de llegada.";
  else if (datos.desde.getTime() < ahora.getTime() - TOLERANCIA_MS) {
    errores.desde = "Esa hora ya pasó. Elija una hora desde ahora.";
  } else if (datos.desde.getTime() > ahora.getTime() + MAXIMO_MS) {
    errores.desde = "Se puede anunciar con hasta 60 días de anticipación.";
  }
  return {
    errores,
    visita: {
      nombre: datos.nombre.trim(),
      dni: datos.dni || null,
      desde: datos.desde,
      hasta: new Date(datos.desde.getTime() + HORAS_DE_PERMISO * 3_600_000),
      conVehiculo: datos.conVehiculo,
      placa: datos.conVehiculo && datos.placa ? normalizarPlaca(datos.placa) : null,
    },
  };
}

/** Una visita programada está en la lista blanca mientras no termine su horario. */
export const estaEnLaLista = (visita: { estado: string; hasta: Date }, ahora: Date) =>
  visita.estado === "PROGRAMADA" && visita.hasta > ahora;
