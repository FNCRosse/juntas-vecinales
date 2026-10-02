import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { aplanar, razonContraste, verificarContraste } from "@/componentes/tokens/contraste";

const CARPETA = path.join(process.cwd(), "componentes/tokens");
const leer = (archivo: string) => readFileSync(path.join(CARPETA, archivo), "utf8");
const tokens = JSON.parse(leer("tokens.json"));
const planos = aplanar(tokens);

describe("@HU-ACC-05 TokensVisuales.cumpleWCAG_AA", () => {
  it("@HU-ACC-05 CA1 todo texto llega a 4.5:1 en Normal y a 7:1 en Senior; borde, foco e ícono a 3:1", () => {
    const resultados = verificarContraste(tokens);
    expect(resultados.length).toBe(228);
    const fallos = resultados
      .filter((r) => r.razon < r.minimo)
      .map((r) => `${r.modo}: ${r.primerPlano} sobre ${r.fondo} = ${r.razon.toFixed(2)}:1`);
    expect(fallos).toEqual([]);
  });

  it("@HU-ACC-05 CA1 falla si un par de tokens baja del mínimo", () => {
    const copia = structuredClone(tokens);
    copia.color.texto.secundario.$value = "{color.paleta.arena.400}";
    const fallos = verificarContraste(copia).filter((r) => r.razon < r.minimo);
    expect(fallos.length).toBeGreaterThan(0);
    expect(fallos.every((r) => r.primerPlano === "color.texto.secundario" && r.modo === "normal")).toBe(true);
  });

  it("@HU-ACC-05 CA1 la razón de contraste coincide con la fórmula WCAG", () => {
    expect(razonContraste("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(razonContraste("#231D18", "#FBF7F1")).toBeCloseTo(15.6, 1);
  });

  it("@HU-ACC-05 CA1 ningún tamaño de texto baja de 16 px en ningún modo", () => {
    const textos = Object.entries(planos).filter(([nombre]) => nombre.startsWith("text."));
    expect(textos.length).toBeGreaterThan(0);
    for (const [, { normal, senior }] of textos) {
      expect(parseFloat(normal)).toBeGreaterThanOrEqual(16);
      expect(parseFloat(senior)).toBeGreaterThanOrEqual(parseFloat(normal));
    }
    expect(parseFloat(planos["text.base"].senior)).toBe(22);
  });
});

describe("@HU-ACC-09 TokensVisuales.areaMinimaTactil", () => {
  it("@HU-ACC-09 CA1 el objetivo táctil mide 48 px en Normal y 56 px en Senior", () => {
    expect(planos["spacing.tactil"]).toEqual({ normal: "48px", senior: "56px" });
    expect(planos["spacing.control"]).toEqual({ normal: "48px", senior: "56px" });
  });

  it("@HU-ACC-09 CA2 la separación entre objetivos es de 8 px en Normal y 12 px en Senior", () => {
    expect(planos["spacing.separacion"]).toEqual({ normal: "8px", senior: "12px" });
  });
});

describe("@HU-ACC-05 Fuente única de los tokens", () => {
  it("@HU-ACC-05 componentes/tokens/tokens.json es la misma guía visual de docs/", () => {
    const guia = readFileSync(path.join(process.cwd(), "docs/guia-visual/tokens.json"), "utf8");
    expect(JSON.parse(guia)).toEqual(tokens);
  });

  it("@HU-ACC-05 tokens.css está generado desde el tokens.json vigente", () => {
    const temporal = mkdtempSync(path.join(tmpdir(), "tokens-"));
    for (const archivo of ["tokens.json", "generar-css.mjs"]) {
      copyFileSync(path.join(CARPETA, archivo), path.join(temporal, archivo));
    }
    execFileSync("node", [path.join(temporal, "generar-css.mjs")], { stdio: "ignore" });
    expect(readFileSync(path.join(temporal, "tokens.css"), "utf8")).toBe(leer("tokens.css"));
  });
});
