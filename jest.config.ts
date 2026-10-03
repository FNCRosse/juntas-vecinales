import type { Config } from "jest";
import nextJest from "next/jest.js";

// SWC de Next transforma TypeScript y resuelve el alias @/ (tsconfig.json).
const conTransformacionDeNext = nextJest({ dir: "./" });

// Cobertura sobre el código de servidor (docs/PRUEBAS.md §3).
const collectCoverageFrom = [
  "modulos/**/*.ts",
  "compartido/**/*.ts",
  "worker/**/*.ts",
  "app/api/**/*.ts",
  "!compartido/bd/generado/**",
];

export default async function configuracion(): Promise<Config> {
  const base = await conTransformacionDeNext({ testEnvironment: "node" })();
  return {
    collectCoverage: true,
    collectCoverageFrom,
    coverageDirectory: "coverage",
    coverageReporters: ["text-summary", "lcov", "json-summary"],
    coverageThreshold: { global: { lines: 80 } },
    // Las pruebas de integración comparten la BD (TRUNCATE, cerrojo del worker): un archivo a la vez.
    maxWorkers: 1,
    projects: [
      {
        ...base,
        displayName: "unitarias",
        setupFiles: ["<rootDir>/pruebas/claveDeCifrado.ts"],
        testMatch: ["<rootDir>/pruebas/unitarias/**/*.test.ts"],
      },
      {
        ...base,
        displayName: "integracion",
        setupFiles: ["<rootDir>/pruebas/claveDeCifrado.ts"],
        testMatch: ["<rootDir>/pruebas/integracion/**/*.test.ts"],
        globalSetup: "<rootDir>/pruebas/integracion/preparar.ts",
      },
    ],
  };
}
