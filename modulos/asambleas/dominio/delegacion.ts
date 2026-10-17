// @HU-ASA-06
// Delegación de voto: un titular le da a una persona de su confianza el permiso de votar por su casa en una
// asamblea. El dominio limpia y revisa los datos y fija el límite de representaciones; no sabe de la BD.

export type CondicionApoderado = "FAMILIAR" | "VECINO" | "EXTERNO";
export const CONDICIONES: readonly CondicionApoderado[] = ["FAMILIAR", "VECINO", "EXTERNO"];

/** Cómo se dice en pantalla y en la constancia («Apoderada: Rosa Huamán, familiar»). */
export const CONDICION_EN_TEXTO: Record<CondicionApoderado, string> = {
  FAMILIAR: "familiar",
  VECINO: "vecino o vecina del barrio",
  EXTERNO: "otra persona",
};

/**
 * Cuántas casas puede representar una misma persona en una asamblea. Es el valor del prototipo (2); el límite
 * normativo lo debe confirmar la directiva (docs/PLAN.md, riesgos de M4). Se cambia solo aquí.
 */
export const MAXIMO_REPRESENTACIONES = 2;

export const MAXIMO_NOMBRE = 120;

export const excedeLimite = (representacionesActuales: number) =>
  representacionesActuales >= MAXIMO_REPRESENTACIONES;

/** «D-0031»: el correlativo de la constancia, con al menos cuatro cifras. */
export const numeroDeConstancia = (numero: number) => `D-${String(numero).padStart(4, "0")}`;

export type DatosDelegacion = { nombre: string; dni: string; condicion: CondicionApoderado };

/** Revisa y limpia los datos. Los mensajes dicen qué corregir, con trato de usted y sin tecnicismos. */
export function prepararDelegacion(datos: DatosDelegacion) {
  const errores: Record<string, string> = {};
  const nombre = datos.nombre.trim().replace(/\s+/g, " ");
  const dni = datos.dni.trim();

  if (!nombre) errores.nombre = "Escriba el nombre de quien votará por usted.";
  else if (nombre.length > MAXIMO_NOMBRE) {
    errores.nombre = `El nombre puede tener hasta ${MAXIMO_NOMBRE} letras. Hágalo más corto.`;
  }
  if (!/^\d{8}$/.test(dni)) errores.dni = "El DNI tiene 8 cifras. Revíselo y escríbalo de nuevo.";
  if (!CONDICIONES.includes(datos.condicion)) errores.condicion = "Elija quién es para usted.";

  return { errores, delegacion: { nombre, dni, condicion: datos.condicion } };
}
