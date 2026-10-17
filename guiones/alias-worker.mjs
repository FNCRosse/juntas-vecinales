// tsc compila el worker a CommonJS pero no reescribe el alias "@/": lo deja como require("@/…"), que Node no
// resuelve. Este paso, que corre justo después de tsc, lo cambia por la ruta relativa dentro de dist/worker
// (docs/BACKEND.md §8). Sin dependencias: solo recorre los .js y reescribe los require.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const RAIZ = join(import.meta.dirname, "..", "dist", "worker");

function archivosJs(carpeta) {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivosJs(ruta);
    return ruta.endsWith(".js") ? [ruta] : [];
  });
}

let reescritos = 0;
for (const archivo of archivosJs(RAIZ)) {
  const original = readFileSync(archivo, "utf8");
  const nuevo = original.replace(/require\((["'])@\/([^"']+)\1\)/g, (_, comilla, destino) => {
    const relativa = relative(dirname(archivo), join(RAIZ, destino)).replaceAll("\\", "/");
    reescritos += 1;
    return `require(${comilla}${relativa.startsWith(".") ? relativa : `./${relativa}`}${comilla})`;
  });
  if (nuevo !== original) writeFileSync(archivo, nuevo);
}
console.log(`Worker: ${reescritos} imports con alias resueltos.`);
