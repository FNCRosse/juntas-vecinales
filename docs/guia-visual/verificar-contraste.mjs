// Verifica contraste WCAG de todas las combinaciones semánticas en los dos modos
// y que los nombres de tokens coincidan entre tokens.json y tokens.css.
// Uso: node verificar-contraste.mjs   (sale con código 1 si algo falla)
import { readFileSync } from 'node:fs';

const leer = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
const json = JSON.parse(leer('tokens.json'));
const MODO = 'pe.juntavecinal';

const planos = {};
(function aplanar(n, ruta = []) {
  if (n.$value !== undefined) return (planos[ruta.join('.')] = { normal: n.$value, senior: n.$extensions?.[MODO]?.senior ?? n.$value });
  for (const [k, v] of Object.entries(n)) if (!k.startsWith('$')) aplanar(v, [...ruta, k]);
})(json);

const hex = (nombre, modo) => {
  const v = planos[nombre][modo];
  const r = v.match(/^\{(.+)\}$/)?.[1];
  return r ? hex(r, modo) : v;
};
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const razon = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const grupo = (g) => Object.keys(planos).filter((k) => k.startsWith(`color.${g}.`));
const textos = grupo('texto').filter((k) => !k.endsWith('invertido'));
const fondos = grupo('fondo');
const neutros = ['color.fondo.pagina', 'color.fondo.superficie', 'color.fondo.suave'];
const rellenos = ['primaria', 'primaria-hover', 'primaria-presionada', 'peligro', 'peligro-hover', 'peligro-presionada'].map((k) => `color.accion.${k}`);

// [primer plano, fondo, tipo]
const pares = [
  ...textos.flatMap((t) => fondos.map((f) => [t, f, 'texto'])),
  ...rellenos.map((f) => ['color.texto.invertido', f, 'texto']),
  // texto del botón secundario = color.accion.primaria sobre fondo claro
  ...[...neutros, 'color.accion.secundaria-hover', 'color.accion.secundaria-presionada'].map((f) => ['color.accion.primaria', f, 'texto']),
  // componentes de interfaz (WCAG 1.4.11)
  ...['control', 'fuerte', 'exito', 'error', 'aviso', 'info'].flatMap((b) => neutros.map((f) => [`color.borde.${b}`, f, 'interfaz'])),
  ...['exito', 'error', 'aviso', 'info'].map((e) => [`color.borde.${e}`, `color.fondo.${e}`, 'interfaz']),
  ...['color.foco.anillo', 'color.accion.primaria', 'color.accion.peligro'].flatMap((c) => neutros.map((f) => [c, f, 'interfaz'])),
];

const minimo = { normal: { texto: 4.5, interfaz: 3 }, senior: { texto: 7, interfaz: 3 } };
let fallos = 0;
for (const modo of ['normal', 'senior']) {
  const r = pares.map(([a, b, tipo]) => ({ a, b, tipo, v: razon(hex(a, modo), hex(b, modo)) }));
  const malos = r.filter((x) => x.v < minimo[modo][x.tipo]);
  fallos += malos.length;
  const peor = (tipo) => r.filter((x) => x.tipo === tipo).sort((x, y) => x.v - y.v)[0];
  console.log(`\nModo ${modo}: ${r.length} combinaciones (texto ≥ ${minimo[modo].texto}:1, interfaz ≥ 3:1)`);
  for (const t of ['texto', 'interfaz']) { const p = peor(t); console.log(`  peor ${t}: ${p.a} sobre ${p.b} = ${p.v.toFixed(2)}:1`); }
  for (const m of malos) console.log(`  FALLA ${m.a} sobre ${m.b} = ${m.v.toFixed(2)}:1`);
}

// Nombres: JSON a.b.c <-> CSS --a-b-c (Tailwind lee las mismas variables; Figma usa a/b/c)
const css = leer('tokens.css');
const decl = (bloque) => new Set([...(css.match(new RegExp(`${bloque}\\s*\\{([^}]*)\\}`))?.[1] ?? '').matchAll(/(--[\w-]+):/g)].map((m) => m[1]).filter((n) => !n.endsWith('-*')));
const aCss = (k) => '--' + k.replaceAll('.', '-');
const TW = ['color', 'font', 'font-weight', 'leading', 'text', 'spacing', 'radius', 'shadow'];
const esperado = {
  ':root': Object.keys(planos).map(aCss),
  '\\[data-mode="senior"\\]': Object.keys(planos).filter((k) => planos[k].senior !== planos[k].normal).map(aCss),
  '@theme inline reference': Object.keys(planos).filter((k) => TW.includes(k.split('.')[0]) && !k.startsWith('color.paleta.')).map(aCss),
};
console.log('\nNombres JSON ↔ CSS ↔ Tailwind:');
for (const [bloque, nombres] of Object.entries(esperado)) {
  const hay = decl(bloque);
  const faltan = nombres.filter((n) => !hay.has(n));
  const sobran = [...hay].filter((n) => !nombres.includes(n));
  fallos += faltan.length + sobran.length;
  console.log(`  ${bloque.replaceAll('\\', '')}: ${hay.size} variables, ${faltan.length} faltan, ${sobran.length} sobran${faltan.length + sobran.length ? ' → ' + [...faltan, ...sobran].join(', ') : ''}`);
}
const colisiones = Object.keys(planos).length - new Set(Object.keys(planos).map(aCss)).size;
fallos += colisiones;
console.log(`  colisiones de nombre al pasar de a.b.c a --a-b-c: ${colisiones}`);

console.log(fallos ? `\nRESULTADO: ${fallos} fallos` : '\nRESULTADO: todo cumple');
process.exit(fallos ? 1 : 0);
