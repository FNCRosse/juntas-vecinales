import { execFileSync } from "node:child_process";
import path from "node:path";

// Código de ejemplo con la ruta en la que se lintea. Las rutas no existen: ESLint aplica
// las reglas según la ruta indicada, así no hace falta crear módulos de relleno.
const casos = [
  {
    nombre: "un módulo importa el dominio de otro",
    ruta: "modulos/aportes/aplicacion/ejemplo.ts",
    codigo: 'import { Usuario } from "@/modulos/identidad/dominio/Usuario";\nexport const x = Usuario;\n',
    rompe: true,
  },
  {
    nombre: "un módulo importa la infraestructura de otro",
    ruta: "modulos/aportes/aplicacion/ejemplo.ts",
    codigo: 'import { repo } from "@/modulos/identidad/infraestructura/repo";\nexport const x = repo;\n',
    rompe: true,
  },
  {
    nombre: "un módulo usa la aplicacion de uno permitido",
    ruta: "modulos/aportes/aplicacion/ejemplo.ts",
    codigo:
      'import { empadronar } from "@/modulos/identidad/aplicacion/empadronar";\nexport const x = empadronar;\n',
    rompe: false,
  },
  {
    nombre: "un módulo usa la aplicacion de uno no permitido por la matriz",
    ruta: "modulos/identidad/aplicacion/ejemplo.ts",
    codigo: 'import { pagar } from "@/modulos/aportes/aplicacion/pagar";\nexport const x = pagar;\n',
    rompe: true,
  },
  {
    nombre: "el dominio importa Prisma",
    ruta: "modulos/aportes/dominio/Cuota.ts",
    codigo: 'import { PrismaClient } from "@prisma/client";\nexport const x = PrismaClient;\n',
    rompe: true,
  },
  {
    nombre: "el dominio importa su propia infraestructura",
    ruta: "modulos/aportes/dominio/Cuota.ts",
    codigo: 'import { repo } from "../infraestructura/repo";\nexport const x = repo;\n',
    rompe: true,
  },
  {
    nombre: "una importación relativa sale del módulo",
    ruta: "modulos/aportes/aplicacion/ejemplo.ts",
    codigo: 'import { Usuario } from "../../identidad/dominio/Usuario";\nexport const x = Usuario;\n',
    rompe: true,
  },
  {
    nombre: "una página importa el dominio de un módulo",
    ruta: "app/ejemplo/page.tsx",
    codigo: 'import { Cuota } from "@/modulos/aportes/dominio/Cuota";\nexport const x = Cuota;\n',
    rompe: true,
  },
  {
    nombre: "el worker importa la infraestructura de un módulo",
    ruta: "worker/tareas/ejemplo.ts",
    codigo: 'import { repo } from "@/modulos/aportes/infraestructura/repo";\nexport const x = repo;\n',
    rompe: true,
  },
  {
    nombre: "compartido importa un módulo",
    ruta: "compartido/auditoria/ejemplo.ts",
    codigo:
      'import { empadronar } from "@/modulos/identidad/aplicacion/empadronar";\nexport const x = empadronar;\n',
    rompe: true,
  },
];

describe("@HU-INFRA Regla de arquitectura en ESLint", () => {
  let reglas: string[][];

  beforeAll(() => {
    const salida = execFileSync("node", [path.join(__dirname, "lintear.mjs")], {
      input: JSON.stringify(casos),
      encoding: "utf8",
    });
    reglas = JSON.parse(salida);
  }, 60_000);

  it.each(casos.map((caso, i) => [caso.nombre, caso.rompe, i] as const))(
    "@HU-INFRA %s → rompe: %s",
    (_nombre, rompe, i) => {
      expect(reglas[i].includes("no-restricted-imports")).toBe(rompe);
    },
  );
});
