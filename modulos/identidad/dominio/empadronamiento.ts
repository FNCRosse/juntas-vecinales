// @HU-GAR-01
// Reglas de las personas de un empadronamiento que no necesitan la BD (HU-GAR-01 CA1 y CA3):
// cada DNI se vio en físico, ningún DNI se repite y cada cuenta propia tiene su WhatsApp.

export type RelacionResidencia = "TITULAR" | "CONYUGE" | "HIJO" | "PADRE" | "OTRO";

export type PersonaNueva = {
  nombreCompleto: string;
  dni: string;
  dniVisto: boolean;
  relacion: RelacionResidencia;
  /** Si tendrá su propia cuenta: recibe su enlace de entrada. El titular siempre la tiene. */
  cuentaPropia: boolean;
  /** 9 números, sin el 51. */
  telefono?: string;
};

export const NOMBRE_RELACION: Record<RelacionResidencia, string> = {
  TITULAR: "Titular",
  CONYUGE: "Esposo o esposa",
  HIJO: "Hijo o hija",
  PADRE: "Padre o madre",
  OTRO: "Otro familiar o inquilino",
};

/** Persona con el prefijo de sus campos en los errores: "titular" u "otros.0", "otros.1"… */
export type PersonaEnFormulario = { prefijo: string; persona: PersonaNueva };

/** Devuelve los errores por campo ("titular.dni", "otros.0.telefono"), vacío si está bien. */
export function revisarPersonas(personas: PersonaEnFormulario[]): Record<string, string> {
  const errores: Record<string, string> = {};
  const dnis = new Set<string>();
  const telefonos = new Set<string>();
  for (const { prefijo, persona } of personas) {
    const esTitular = persona.relacion === "TITULAR";
    if (!persona.dniVisto) {
      errores[`${prefijo}.dniVisto`] = esTitular
        ? "Falta confirmar que vio el DNI. Pídale el documento y marque la casilla."
        : "Falta confirmar que vio el DNI de esta persona.";
    }
    if (dnis.has(persona.dni)) {
      errores[`${prefijo}.dni`] = "Este DNI ya está en esta vivienda. Revise los números.";
    }
    dnis.add(persona.dni);

    if (!persona.cuentaPropia) continue;
    if (!persona.telefono) {
      errores[`${prefijo}.telefono`] = esTitular
        ? "Falta su WhatsApp (9 números). A ese número le enviaremos su enlace de entrada."
        : 'Para enviarle su enlace hace falta su WhatsApp (9 números). Si no tiene, apague "Tendrá su propia cuenta".';
    } else if (telefonos.has(persona.telefono)) {
      errores[`${prefijo}.telefono`] = "Cada cuenta necesita su propio WhatsApp. Escriba otro número.";
    }
    if (persona.telefono) telefonos.add(persona.telefono);
  }
  return errores;
}

/** El teléfono se guarda con el código del Perú, como lo pide WhatsApp. */
export function telefonoCompleto(telefono: string) {
  return `51${telefono}`;
}
