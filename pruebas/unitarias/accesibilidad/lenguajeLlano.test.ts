import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// Guía de lenguaje llano (docs/ACCESIBILIDAD.md §5, R-07). Revisa los textos que ve la persona en
// componentes, pantallas y mensajes de error del servidor.

const RAIZ = process.cwd();
const CARPETAS = ["componentes/a11y", "app", "compartido"];

function archivos(carpeta: string): string[] {
  const ruta = path.join(RAIZ, carpeta);
  return readdirSync(ruta).flatMap((nombre) => {
    const completo = path.join(ruta, nombre);
    if (statSync(completo).isDirectory())
      return nombre === "generado" ? [] : archivos(path.join(carpeta, nombre));
    return /\.tsx?$/.test(nombre) ? [path.join(carpeta, nombre)] : [];
  });
}

/** Textos para personas: el texto de JSX y las cadenas que empiezan en mayúscula y tienen espacios. */
function textosVisibles(codigo: string) {
  const sinComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const jsx = [...sinComentarios.matchAll(/>\s*([^<>{}]*[A-Za-zÁÉÍÓÚáéíóúñ][^<>{}]*?)\s*</g)].map(
    (m) => m[1],
  );
  const cadenas = [...sinComentarios.matchAll(/["`]((?:[¿¡]?[A-ZÁÉÍÓÚÑ])[^"`]*\s[^"`]*)["`]/g)].map(
    (m) => m[1],
  );
  return [...jsx, ...cadenas]
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => /\s/.test(t) || jsx.includes(t));
}

const EXCLUIDAS = [
  /\blink\b/i,
  /\btoken\b/i,
  /\blogin\b/i,
  /\bpassword\b/i,
  /\bclic(k)?\b/i,
  /\bmoros[oa]s?\b/i,
  /\bdeudor(a|es|as)?\b/i,
  /\bsincroniza/i,
  /\binválid[oa]s?\b/i,
  /error de validación/i,
  /sesión expirada/i,
];

const textos = CARPETAS.flatMap(archivos)
  .filter((a) => !a.includes("tokens"))
  .flatMap((archivo) =>
    textosVisibles(readFileSync(path.join(RAIZ, archivo), "utf8")).map((texto) => ({ archivo, texto })),
  )
  // Lo técnico que no llega a la persona: rutas, clases de CSS, mensajes del log y de la configuración.
  .filter(
    ({ texto }) =>
      !/^(Faltan|Hace falta|No se pudo|No existe|Error no|La confirmación en dos|Meta respondió|WHATSAPP_|Fallo simulado|Bearer )/.test(
        texto,
      ),
  );

describe("@HU-ACC-08 Lenguaje llano en componentes y mensajes", () => {
  it("@HU-ACC-08 hay textos que revisar y la revisión detecta una palabra excluida", () => {
    expect(textos.length).toBeGreaterThan(30);
    const ejemplo = textosVisibles('<Boton>Haga clic en el link</Boton>; const m = "Usuario moroso";');
    expect(ejemplo.filter((t) => EXCLUIDAS.some((r) => r.test(t)))).toEqual([
      "Haga clic en el link",
      "Usuario moroso",
    ]);
  });

  it("@HU-ACC-08 CA1 ningún texto usa la lista de tecnicismos y palabras excluidas", () => {
    const hallazgos = textos.filter(({ texto }) => EXCLUIDAS.some((r) => r.test(texto)));
    expect(hallazgos).toEqual([]);
  });

  it("@HU-ACC-08 CA1 cada oración tiene 20 palabras o menos", () => {
    const largas = textos.flatMap(({ archivo, texto }) =>
      texto
        .split(/(?<=[.!?])\s+/)
        .filter((oracion) => oracion.split(/\s+/).length > 20)
        .map((oracion) => ({ archivo, oracion })),
    );
    expect(largas).toEqual([]);
  });

  it("@HU-ACC-08 CA2 los mensajes de error del servidor dicen qué hacer a continuación", async () => {
    const errores = await import("@/compartido/errores");
    const mensajes = [
      new errores.ErrorValidacion().mensaje,
      new errores.ErrorNoAutenticado().mensaje,
      new errores.ErrorNoAutorizado().mensaje,
      new errores.ErrorNoEncontrado().mensaje,
      errores.MENSAJE_ERROR_INESPERADO,
    ];
    for (const mensaje of mensajes) {
      expect(mensaje).toMatch(/\b(vuelva|revise|intente|pida|corríjalos|inténtelo)\b/i);
      expect(mensaje).not.toMatch(/\b(error|código|\d{3})\b/i);
    }
  });
});
