// Dinero en céntimos enteros (CLAUDE.md regla 8): lo que escribe una persona en soles se lee y se muestra
// aquí, para no sumar nunca decimales flotantes.

/** "1,250.50", "S/ 5", "0.07" → céntimos enteros. Devuelve null si no es un monto válido. */
export function aCentimos(texto: string): number | null {
  const limpio = texto.replace(/S\/\.?/gi, "").replace(/\s/g, "");
  const m = /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/.exec(limpio);
  if (!m) return null;
  const soles = Number(m[1].replaceAll(",", ""));
  const centimos = Number((m[2] ?? "").padEnd(2, "0") || "0");
  return soles * 100 + centimos;
}

/** Céntimos → "S/ 1,250.50"; un saldo negativo se escribe "−S/ 25.75". */
export function soles(centimos: number) {
  const valor = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Math.abs(centimos) / 100,
  );
  return `${centimos < 0 ? "−" : ""}S/ ${valor}`;
}
