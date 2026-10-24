// @HU-COB-03
// Reclamo de cuota (HU-COB-03): los motivos que ofrece la lista y qué se le pide a la casa. El dominio no sabe de la BD ni
// de los archivos.

export const MOTIVOS_RECLAMO = ["SIN_INQUILINO", "MENOS_VEHICULOS", "YA_PAGUE", "OTRO"] as const;
export type MotivoReclamo = (typeof MOTIVOS_RECLAMO)[number];

export const MAXIMO_DETALLE = 300;

/** Lo que elige la casa, con las palabras del prototipo. */
export const MOTIVOS: Record<MotivoReclamo, string> = {
  SIN_INQUILINO: "Ya no tengo inquilino",
  MENOS_VEHICULOS: "Tengo menos autos o motos de lo que figura",
  YA_PAGUE: "Ya pagué y no aparece",
  OTRO: "Otro motivo",
};

/** El número del reclamo como se ve: «R-0027». */
export const numeroDeReclamo = (numero: number) => `R-${String(numero).padStart(4, "0")}`;

/** Revisa lo que escribe la casa: el motivo es obligatorio y «otro motivo» pide contar cuál es. El documento es opcional. */
export function prepararReclamo(datos: { motivo: string; detalle: string }) {
  const errores: Record<string, string> = {};
  const motivo = MOTIVOS_RECLAMO.find((m) => m === datos.motivo);
  const detalle = datos.detalle.trim();
  if (!motivo) errores.motivo = "Elija por qué cree que su cuota no es correcta.";
  if (motivo === "OTRO" && !detalle) errores.detalle = "Cuéntenos cuál es el motivo.";
  else if (detalle.length > MAXIMO_DETALLE) {
    errores.detalle = `Puede escribir hasta ${MAXIMO_DETALLE} letras. Hágalo más corto.`;
  }
  if (Object.keys(errores).length || !motivo) return { errores, reclamo: null };
  return { errores, reclamo: { motivo, detalle: detalle || null } };
}

// --- La respuesta de la directiva (HU-COB-04) ---

/** Qué concepto de la cuota puede quitar la directiva según el motivo. «Ya pagué» no se resuelve ajustando la cuota. */
export const CONCEPTOS_POR_MOTIVO: Record<MotivoReclamo, readonly string[]> = {
  SIN_INQUILINO: ["inquilino"],
  MENOS_VEHICULOS: ["auto", "moto", "triciclo"],
  YA_PAGUE: [],
  OTRO: ["inquilino", "auto", "moto", "triciclo", "negocio"],
};

export type LineaDeCuota = { clave: string; nombre: string; montoUnitario: number; cantidad: number };

/** Los ajustes que se pueden aprobar: quitar una unidad de un concepto que la cuota de hoy tiene y que el motivo permite. */
export function ajustesPosibles(motivo: MotivoReclamo, lineas: LineaDeCuota[]) {
  return lineas
    .filter((l) => l.cantidad > 0 && CONCEPTOS_POR_MOTIVO[motivo].includes(l.clave))
    .map((l) => ({ clave: l.clave, nombre: l.nombre, unitario: l.montoUnitario }));
}

/** La cuota (monto y lo que falta pagar) después de quitar una unidad de un concepto; nunca baja de cero. */
export function cuotaAjustada(montoCalculado: number, saldoPendiente: number, unitario: number) {
  return {
    montoNuevo: Math.max(0, montoCalculado - unitario),
    saldoNuevo: Math.max(0, saldoPendiente - unitario),
  };
}

export type Decision = { tipo: "APROBAR"; clave: string } | { tipo: "MANTENER"; motivo: string };

/** Revisa la decisión: elegir una de las dos; si se mantiene la cuota, hay que explicar el motivo a la casa. */
export function prepararDecision(datos: { decision: string; motivo: string }) {
  const errores: Record<string, string> = {};
  const motivo = datos.motivo.trim();
  let decision: Decision | null = null;
  if (datos.decision === "MANTENER") {
    if (!motivo) errores.motivo = "Escriba el motivo para explicárselo a la casa.";
    else if (motivo.length > MAXIMO_DETALLE) {
      errores.motivo = `Puede escribir hasta ${MAXIMO_DETALLE} letras. Hágalo más corto.`;
    } else decision = { tipo: "MANTENER", motivo };
  } else if (/^APROBAR:[a-z]+$/.test(datos.decision)) {
    decision = { tipo: "APROBAR", clave: datos.decision.slice("APROBAR:".length) };
  } else errores.decision = "Elija qué decide.";
  return { errores, decision };
}
