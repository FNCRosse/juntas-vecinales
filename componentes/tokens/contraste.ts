// @HU-ACC-05
// Contraste WCAG de los tokens semánticos en los modos Normal y Senior (guía visual §1.3 y §1.4).
// Lo usa la prueba de Jest (TokensVisuales.cumpleWCAG_AA): falla si un par baja del mínimo.

const MODO = "pe.juntavecinal";

type NodoToken = {
  $value?: string;
  $extensions?: Record<string, { senior?: string }>;
  [clave: string]: unknown;
};
export type Modo = "normal" | "senior";
type Tipo = "texto" | "interfaz";
export type Par = { primerPlano: string; fondo: string; tipo: Tipo };
export type Resultado = Par & { modo: Modo; razon: number; minimo: number };

export const MINIMOS: Record<Modo, Record<Tipo, number>> = {
  normal: { texto: 4.5, interfaz: 3 },
  senior: { texto: 7, interfaz: 3 },
};

/** Aplana tokens.json a `a.b.c → { normal, senior }`. */
export function aplanar(json: unknown) {
  const planos: Record<string, Record<Modo, string>> = {};
  (function recorrer(nodo: NodoToken, ruta: string[]) {
    if (nodo.$value !== undefined) {
      planos[ruta.join(".")] = {
        normal: String(nodo.$value),
        senior: String(nodo.$extensions?.[MODO]?.senior ?? nodo.$value),
      };
      return;
    }
    for (const [clave, valor] of Object.entries(nodo)) {
      if (!clave.startsWith("$")) recorrer(valor as NodoToken, [...ruta, clave]);
    }
  })(json as NodoToken, []);
  return planos;
}

function hexadecimal(planos: ReturnType<typeof aplanar>, nombre: string, modo: Modo): string {
  const valor = planos[nombre]?.[modo];
  if (valor === undefined) throw new Error(`No existe el token ${nombre}`);
  const referencia = valor.match(/^\{(.+)\}$/)?.[1];
  return referencia ? hexadecimal(planos, referencia, modo) : valor;
}

function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razón de contraste WCAG entre dos colores #RRGGBB. */
export function razonContraste(a: string, b: string) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Las combinaciones que revisa la guía: todo texto sobre todo fondo, rellenos y componentes. */
export function paresAVerificar(planos: ReturnType<typeof aplanar>): Par[] {
  const grupo = (g: string) => Object.keys(planos).filter((k) => k.startsWith(`color.${g}.`));
  const par = (primerPlano: string, fondo: string, tipo: Tipo): Par => ({ primerPlano, fondo, tipo });
  const textos = grupo("texto").filter((k) => !k.endsWith("invertido"));
  const fondos = grupo("fondo");
  const neutros = ["color.fondo.pagina", "color.fondo.superficie", "color.fondo.suave"];
  const rellenos = [
    "primaria",
    "primaria-hover",
    "primaria-presionada",
    "peligro",
    "peligro-hover",
    "peligro-presionada",
  ];
  const estados = ["exito", "error", "aviso", "info"];
  return [
    ...textos.flatMap((t) => fondos.map((f) => par(t, f, "texto"))),
    ...rellenos.map((r) => par("color.texto.invertido", `color.accion.${r}`, "texto")),
    // Texto del botón secundario: color.accion.primaria sobre fondo claro.
    ...[...neutros, "color.accion.secundaria-hover", "color.accion.secundaria-presionada"].map((f) =>
      par("color.accion.primaria", f, "texto"),
    ),
    // Componentes de interfaz (WCAG 1.4.11).
    ...["control", "fuerte", ...estados].flatMap((b) =>
      neutros.map((f) => par(`color.borde.${b}`, f, "interfaz")),
    ),
    ...estados.map((e) => par(`color.borde.${e}`, `color.fondo.${e}`, "interfaz")),
    ...["color.foco.anillo", "color.accion.primaria", "color.accion.peligro"].flatMap((c) =>
      neutros.map((f) => par(c, f, "interfaz")),
    ),
  ];
}

/** Calcula el contraste de cada par en los dos modos. */
export function verificarContraste(json: unknown): Resultado[] {
  const planos = aplanar(json);
  const pares = paresAVerificar(planos);
  return (["normal", "senior"] as const).flatMap((modo) =>
    pares.map((p) => ({
      ...p,
      modo,
      razon: razonContraste(hexadecimal(planos, p.primerPlano, modo), hexadecimal(planos, p.fondo, modo)),
      minimo: MINIMOS[modo][p.tipo],
    })),
  );
}
