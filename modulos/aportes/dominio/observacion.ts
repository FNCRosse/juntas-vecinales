// @HU-COB-10
// Observar un comprobante (HU-COB-10): la directiva marca el pago con un motivo tipificado y la casa lo lee en llano. El
// dominio revisa el motivo y arma los textos; no sabe de la BD. El tono es cordial: nunca se culpa a la vecina (R-07).

export type MotivoObservacion = "MONTO_INSUFICIENTE" | "IMAGEN_BORROSA" | "FECHA_ERRONEA" | "OTRO";
export const MOTIVOS_OBSERVACION: readonly MotivoObservacion[] = [
  "MONTO_INSUFICIENTE",
  "IMAGEN_BORROSA",
  "FECHA_ERRONEA",
  "OTRO",
];

export const MAXIMO_NOTA = 300;

/** `etiqueta` es lo que elige la directiva; `resumen` es cómo se dice dentro de una frase («Observado: la foto se ve borrosa»). */
export const MOTIVOS: Record<MotivoObservacion, { etiqueta: string; resumen: string }> = {
  MONTO_INSUFICIENTE: { etiqueta: "Monto insuficiente", resumen: "el monto no alcanza" },
  IMAGEN_BORROSA: { etiqueta: "La imagen se ve borrosa", resumen: "la foto se ve borrosa" },
  FECHA_ERRONEA: { etiqueta: "La fecha no coincide", resumen: "la fecha no coincide" },
  OTRO: { etiqueta: "Otro motivo", resumen: "otro motivo" },
};

/** Revisa el motivo y la nota que escribe la directiva. «Otro motivo» exige la nota: es lo único que dice qué pasó. */
export function prepararObservacion(datos: { motivo: string; nota: string }) {
  const errores: Record<string, string> = {};
  const motivo = MOTIVOS_OBSERVACION.find((m) => m === datos.motivo);
  const nota = datos.nota.trim();
  if (!motivo) errores.motivo = "Elija por qué lo observa.";
  if (motivo === "OTRO" && !nota) errores.nota = "Escriba cuál es el motivo.";
  else if (nota.length > MAXIMO_NOTA) {
    errores.nota = `La nota puede tener hasta ${MAXIMO_NOTA} letras. Hágala más corta.`;
  }
  if (Object.keys(errores).length || !motivo) return { errores, observacion: null };
  return { errores, observacion: { motivo, nota: nota || null } };
}

const sinPunto = (texto: string) => texto.replace(/[.\s]+$/, "");
const minuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1);

/**
 * Lo que lee la casa en Mis pagos y en «Enviar otra foto»: el motivo en pocas palabras, un título y qué hacer.
 * La nota de la directiva se suma; con «otro motivo», la nota es el motivo.
 */
export function textoParaLaVecina(motivo: MotivoObservacion, nota: string | null) {
  if (motivo === "OTRO") {
    const motivoEscrito = sinPunto(nota ?? "");
    return {
      resumen: minuscula(motivoEscrito),
      titulo: "La directiva necesita revisar algo",
      texto: `${motivoEscrito}. Envíe otra foto cuando pueda.`,
    };
  }
  const base = {
    MONTO_INSUFICIENTE: {
      titulo: "El monto de la foto no alcanza",
      texto: "Envíe otra foto donde se vea el monto completo, o pague la diferencia desde Mi cuota.",
    },
    IMAGEN_BORROSA: {
      titulo: "La directiva no pudo leer la foto",
      texto: "Solo necesitan una foto más clara, donde se vean el monto y la fecha.",
    },
    FECHA_ERRONEA: {
      titulo: "La fecha de la foto no coincide",
      texto: "Envíe otra foto donde se vea la fecha de su pago.",
    },
  }[motivo];
  return {
    resumen: MOTIVOS[motivo].resumen,
    titulo: base.titulo,
    texto: nota ? `${base.texto} ${nota.trim()}` : base.texto,
  };
}
