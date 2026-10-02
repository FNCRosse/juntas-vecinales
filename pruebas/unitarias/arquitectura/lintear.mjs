// Lintea con la API de ESLint código de ejemplo como si viviera en otra ruta del repo.
// Corre en un proceso aparte porque ESLint carga eslint.config.mjs con import(),
// que el entorno de Jest no permite. Entrada: [{ ruta, codigo }] por stdin; salida: reglas violadas.
import { ESLint } from "eslint";

const casos = JSON.parse(await new Response(process.stdin).text());
// import/no-cycle necesita archivos reales en disco; aquí solo se prueba no-restricted-imports.
const eslint = new ESLint({ overrideConfig: { rules: { "import/no-cycle": "off" } } });
const resultados = [];
for (const { ruta, codigo } of casos) {
  const [resultado] = await eslint.lintText(codigo, { filePath: ruta });
  resultados.push(resultado.messages.map((m) => m.ruleId));
}
process.stdout.write(JSON.stringify(resultados));
