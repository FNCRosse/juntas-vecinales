// Matriz de trazabilidad HU → código → pruebas (docs/PRUEBAS.md §2). Uso: npm run matriz
// Recorre el código y las pruebas buscando las etiquetas @HU-XXX-nn y escribe docs/evidencias/matriz-hu.md.
// Sale con error si una HU marcada [x] en docs/PLAN.md no tiene código etiquetado o no tiene e2e.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const CODIGO = ["modulos", "compartido", "componentes", "app", "worker"];
const PRUEBAS = { unitarias: "pruebas/unitarias", integracion: "pruebas/integracion", e2e: "pruebas/e2e" };
const IGNORAR = new Set(["node_modules", "generado", "reportes", "screenshots", "videos"]);
const ETIQUETA = /@(HU-[A-Z]{3}-\d{2})\b/g;

function archivos(carpeta) {
  const ruta = path.join(RAIZ, carpeta);
  try {
    statSync(ruta);
  } catch {
    return [];
  }
  return readdirSync(ruta).flatMap((nombre) => {
    if (IGNORAR.has(nombre)) return [];
    const relativa = path.join(carpeta, nombre);
    if (statSync(path.join(RAIZ, relativa)).isDirectory()) return archivos(relativa);
    return /\.(ts|tsx|mjs)$/.test(nombre) ? [relativa] : [];
  });
}

/** HU → conjunto de archivos donde aparece su etiqueta. */
function indexar(carpetas) {
  const indice = new Map();
  for (const archivo of carpetas.flatMap(archivos)) {
    for (const [, hu] of readFileSync(path.join(RAIZ, archivo), "utf8").matchAll(ETIQUETA)) {
      if (!indice.has(hu)) indice.set(hu, new Set());
      indice.get(hu).add(archivo.split(path.sep).join("/"));
    }
  }
  return indice;
}

const codigo = indexar(CODIGO);
const pruebas = Object.fromEntries(
  Object.entries(PRUEBAS).map(([nivel, carpeta]) => [nivel, indexar([carpeta])]),
);

// Casillas del plan: [x] cerrada, [~] en parte, [ ] pendiente, [-] diferida.
const plan = readFileSync(path.join(RAIZ, "docs/PLAN.md"), "utf8");
const casillas = new Map(
  [...plan.matchAll(/^- \[([ x~-])\] (HU-[A-Z]{3}-\d{2}) (.+)$/gm)].map(([, marca, hu, titulo]) => [
    hu,
    { marca, titulo: titulo.replace(/ — .*$/, "").trim() },
  ]),
);

const ESTADO = { x: "Cerrada", "~": "En parte", " ": "Pendiente", "-": "Diferida" };
const lista = (conjunto) =>
  conjunto
    ? [...conjunto]
        .sort()
        .map((a) => `\`${a}\``)
        .join("<br>")
    : "—";

const filas = [...casillas].map(([hu, { marca, titulo }]) => {
  const fila = {
    hu,
    titulo,
    estado: ESTADO[marca],
    codigo: codigo.get(hu),
    ...Object.fromEntries(Object.keys(PRUEBAS).map((n) => [n, pruebas[n].get(hu)])),
  };
  return fila;
});
const conAlgo = filas.filter(
  (f) => f.estado !== "Pendiente" || f.codigo || Object.keys(PRUEBAS).some((n) => f[n]),
);

const errores = filas
  .filter((f) => f.estado === "Cerrada")
  .flatMap((f) => [
    ...(f.codigo ? [] : [`${f.hu} está cerrada en el PLAN y ningún archivo de código lleva // @${f.hu}`]),
    ...(f.e2e ? [] : [`${f.hu} está cerrada en el PLAN y no tiene ninguna prueba e2e @${f.hu}`]),
  ]);

const cerradas = filas.filter((f) => f.estado === "Cerrada");
const conE2e = cerradas.filter((f) => f.e2e).length;

const md = `# Matriz HU → código → pruebas

Generada por \`npm run matriz\` (\`guiones/matriz-hu.mjs\`) desde las etiquetas \`@HU-…\`. No se edita a mano.

- HU en el plan: ${filas.length} · cerradas: ${cerradas.length} · cerradas con e2e: ${conE2e} de ${cerradas.length} (${cerradas.length ? Math.round((conE2e * 100) / cerradas.length) : 100} %).
- Se listan las HU con casilla distinta de pendiente o con algo etiquetado.

| HU | Estado | Código | Unitarias | Integración | E2E |
| --- | --- | --- | --- | --- | --- |
${conAlgo.map((f) => `| ${f.hu} ${f.titulo} | ${f.estado} | ${lista(f.codigo)} | ${lista(f.unitarias)} | ${lista(f.integracion)} | ${lista(f.e2e)} |`).join("\n")}
`;

writeFileSync(path.join(RAIZ, "docs/evidencias/matriz-hu.md"), md);
console.log(
  `docs/evidencias/matriz-hu.md: ${conAlgo.length} HU listadas, ${cerradas.length} cerradas, ${conE2e} con e2e.`,
);
if (errores.length) {
  console.error(errores.map((e) => `ERROR: ${e}`).join("\n"));
  process.exit(1);
}
