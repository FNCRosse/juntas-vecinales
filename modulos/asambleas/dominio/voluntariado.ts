// @HU-ASA-09
// Voluntariado en una actividad pro fondos: una casa ofrece su ayuda y la directiva la aprueba asignándole un rol.
// Quien queda aprobado no paga la colaboración del evento.

export type EstadoVoluntariado = "PENDIENTE" | "APROBADO" | "NO_APROBADO";
export type DecisionVoluntariado = "APROBAR" | "NO_APROBAR";

export const MAXIMO_DESCRIPCION = 300;
export const MAXIMO_ROL = 80;

/** Revisa y limpia lo que la persona cuenta de cómo ayudaría. */
export function prepararVoluntariado(datos: { descripcion: string }) {
  const errores: Record<string, string> = {};
  const descripcion = datos.descripcion.trim().replace(/\s+/g, " ");
  if (!descripcion) errores.descripcion = "Cuéntenos cómo le gustaría ayudar.";
  else if (descripcion.length > MAXIMO_DESCRIPCION) {
    errores.descripcion = `Puede escribir hasta ${MAXIMO_DESCRIPCION} letras. Hágalo más corto.`;
  }
  return { errores, descripcion };
}

/** Revisa la decisión de la directiva (HU-ASA-09 CA2): aprobar exige el rol asignado; no aprobar, no. */
export function prepararDecisionVoluntariado(datos: { decision: DecisionVoluntariado; rol: string }) {
  const errores: Record<string, string> = {};
  const rol = datos.rol.trim().replace(/\s+/g, " ");
  if (datos.decision !== "APROBAR" && datos.decision !== "NO_APROBAR") {
    errores.decision = "Elija si aprueba la ayuda o no.";
  } else if (datos.decision === "APROBAR") {
    if (!rol) errores.rol = "Escriba el rol que tendrá, por ejemplo «Cocina» o «Mesa de la entrada».";
    else if (rol.length > MAXIMO_ROL) {
      errores.rol = `El rol puede tener hasta ${MAXIMO_ROL} letras. Hágalo más corto.`;
    }
  }
  return { errores, rol: datos.decision === "APROBAR" ? rol : null };
}

/** Un voluntario aprobado no paga la colaboración del evento (HU-ASA-09 CA3). */
export const eximeDeCuota = (estado: EstadoVoluntariado) => estado === "APROBADO";
