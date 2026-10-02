// Genera tokens.css desde tokens.json. Uso: node generar-css.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const MODO = 'pe.juntavecinal';
const REM = ['text', 'spacing']; // en rem para respetar el zoom de texto del navegador (WCAG 1.4.4)
const TAILWIND = ['color', 'font', 'font-weight', 'leading', 'text', 'spacing', 'radius', 'shadow'];

function aplanar(nodo, ruta = [], tipo, out = []) {
  if (nodo.$value !== undefined) {
    out.push({ ruta, tipo: nodo.$type ?? tipo, valor: nodo.$value, senior: nodo.$extensions?.[MODO]?.senior });
    return out;
  }
  for (const [k, v] of Object.entries(nodo)) if (!k.startsWith('$')) aplanar(v, [...ruta, k], nodo.$type ?? tipo, out);
  return out;
}
const nombreCss = (ruta) => '--' + ruta.join('-');
const ref = (v) => typeof v === 'string' && v.match(/^\{(.+)\}$/)?.[1];

function css(t, v) {
  const r = ref(v);
  if (r) return `var(${nombreCss(r.split('.'))})`;
  if (t.tipo === 'fontFamily') return v.map((f) => (f.includes(' ') ? `"${f}"` : f)).join(', ');
  if (t.tipo === 'shadow') return v.map((s) => `${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${s.color}`).join(', ');
  if (t.tipo === 'dimension' && REM.includes(t.ruta[0])) return `${parseFloat(v) / 16}rem`;
  return String(v);
}

const tokens = aplanar(JSON.parse(readFileSync(new URL('tokens.json', import.meta.url))));
const linea = (t, v) => `  ${nombreCss(t.ruta)}: ${css(t, v)};`;
const tw = tokens.filter((t) => TAILWIND.includes(t.ruta[0]) && t.ruta[1] !== 'paleta');

writeFileSync(new URL('tokens.css', import.meta.url), `/* GENERADO por generar-css.mjs desde tokens.json. No editar a mano. */

/* Modo normal */
:root {
${tokens.map((t) => linea(t, t.valor)).join('\n')}
}

/* Modo senior: <html data-mode="senior"> (HU-ACC-01) */
[data-mode="senior"] {
${tokens.filter((t) => t.senior !== undefined).map((t) => linea(t, t.senior)).join('\n')}
}

/* Variante de Tailwind para el modo senior: senior:hidden, senior:p-6 ... */
@custom-variant senior (&:where([data-mode="senior"], [data-mode="senior"] *));

/* Tailwind v4. Solo tokens semánticos: la paleta cruda no genera clases.
   "inline" = la clase lee la variable en tiempo de ejecución (el modo senior aplica sin recompilar);
   "reference" = Tailwind no vuelve a declarar las variables (ya están en :root). Probado con tailwindcss 4.3.3. */
@theme inline reference {
  --color-*: initial;
  --font-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
${tw.map((t) => `  ${nombreCss(t.ruta)}: var(${nombreCss(t.ruta)});`).join('\n')}
}
`);
console.log(`tokens.css: ${tokens.length} tokens, ${tokens.filter((t) => t.senior !== undefined).length} sobreescrituras senior, ${tw.length} en Tailwind`);
