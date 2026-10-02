import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Matriz de dependencias permitidas entre módulos (docs/ARQUITECTURA.md §3).
const MODULOS_PERMITIDOS = {
  identidad: ["accesibilidad"],
  transparencia: ["identidad", "aportes", "asambleas", "accesibilidad"],
  incidencias: ["identidad", "accesibilidad"],
  asambleas: ["identidad", "accesibilidad"],
  aportes: ["identidad", "accesibilidad"],
  accesibilidad: [],
};
const MODULOS = Object.keys(MODULOS_PERMITIDOS);

const PUERTO_PUBLICO =
  "Use la aplicacion/ del módulo: el dominio/ y la infraestructura/ no se importan desde fuera (ARQUITECTURA.md §2).";

const capasInternas = (modulo) => ({
  group: [`@/modulos/${modulo}/dominio/**`, `@/modulos/${modulo}/infraestructura/**`],
  message: PUERTO_PUBLICO,
});

const rutasRelativas = {
  group: ["../../*"],
  message: "Dentro de modulos/ no se sube dos niveles: use el alias @/ (ARQUITECTURA.md §2).",
};

const pureza = {
  group: [
    "@prisma/client",
    "@prisma/*",
    "next",
    "next/*",
    "react",
    "react/*",
    "react-dom",
    "react-dom/*",
    "zod",
    "@/compartido/bd/**",
    "@/modulos/**",
    "**/infraestructura/**",
    "**/aplicacion/**",
  ],
  message: "El dominio solo importa su propio dominio/ y TypeScript puro (ARQUITECTURA.md §2).",
};

// Patrones de un módulo: lo que no está en su fila de la matriz queda prohibido por completo;
// de lo permitido, solo la aplicacion/.
function patronesDelModulo(modulo) {
  return MODULOS.filter((otro) => otro !== modulo).map((otro) =>
    MODULOS_PERMITIDOS[modulo].includes(otro)
      ? capasInternas(otro)
      : {
          group: [`@/modulos/${otro}/**`],
          message: `El módulo ${modulo} no puede usar ${otro} (matriz de ARQUITECTURA.md §3).`,
        },
  );
}

const reglasDeModulos = MODULOS.flatMap((modulo) => [
  {
    files: [`modulos/${modulo}/**/*.{ts,tsx}`],
    ignores: [`modulos/${modulo}/dominio/**`],
    rules: {
      "no-restricted-imports": ["error", { patterns: [...patronesDelModulo(modulo), rutasRelativas] }],
    },
  },
  {
    files: [`modulos/${modulo}/dominio/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [...patronesDelModulo(modulo), rutasRelativas, pureza] },
      ],
    },
  },
]);

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "jsx-a11y/alt-text": "error",
      "import/no-cycle": "error",
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "worker/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modulos/*/dominio/**",
                "@/modulos/*/infraestructura/**",
                "**/modulos/*/dominio/**",
                "**/modulos/*/infraestructura/**",
              ],
              message: PUERTO_PUBLICO,
            },
          ],
        },
      ],
    },
  },
  {
    files: ["compartido/**/*.{ts,tsx}", "componentes/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modulos/**", "**/modulos/**"],
              message: "compartido/ y componentes/ no importan módulos (ARQUITECTURA.md §2).",
            },
          ],
        },
      ],
    },
  },
  ...reglasDeModulos,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "next-env.d.ts",
    "compartido/bd/generado/**",
    "docs/**",
    "graphify-out/**",
    "pruebas/e2e/reportes/**",
  ]),
]);
