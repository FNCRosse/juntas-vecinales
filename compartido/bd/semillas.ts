import { cifrarClave } from "../claves";
import { prisma } from "./cliente";
import type { NombreRol, Prisma } from "./generado/client";

// Semillas ficticias (docs/DATOS.md §5): solo en local y en el CI. Nunca en Neon: las previews son
// copias de producción y una clave conocida daría acceso a ellas.

type Persona = {
  nombreCompleto: string;
  dni: string;
  telefonoWhatsApp: string;
  roles: NombreRol[];
  equipo?: boolean;
  /** Predio donde es titular (docs/DATOS.md §5). */
  predio?: Omit<Prisma.PredioCreateInput, "residencias">;
};

// DNI y teléfonos inventados.
export const PERSONAS: Persona[] = [
  {
    nombreCompleto: "Ana Flores",
    dni: "40000001",
    telefonoWhatsApp: "51900000001",
    roles: ["ADMINISTRADOR"],
    equipo: true,
  },
  {
    nombreCompleto: "Marta Rojas",
    dni: "40000002",
    telefonoWhatsApp: "51900000002",
    roles: ["DIRECTIVA", "VECINO"],
    equipo: true,
    predio: { manzana: "A", lote: "12", uso: "VIVIENDA" },
  },
  {
    nombreCompleto: "Pedro Chávez",
    dni: "40000003",
    telefonoWhatsApp: "51900000003",
    roles: ["DIRECTIVO_MEDIADOR"],
    equipo: true,
  },
  {
    nombreCompleto: "Luis Paredes",
    dni: "40000004",
    telefonoWhatsApp: "51900000004",
    roles: ["VIGILANTE"],
    equipo: true,
  },
  {
    nombreCompleto: "Carmen Huamán",
    dni: "08123478",
    telefonoWhatsApp: "51900000005",
    roles: ["VECINO_ADULTO_MAYOR"],
    predio: { manzana: "C", lote: "7", uso: "VIVIENDA", inquilinos: 1 },
  },
  {
    nombreCompleto: "Julio Mendoza",
    dni: "40000006",
    telefonoWhatsApp: "51900000006",
    roles: ["VECINO"],
    predio: { manzana: "A", lote: "3", uso: "VIVIENDA", autos: 1 },
  },
  {
    nombreCompleto: "Rosa Díaz",
    dni: "40000007",
    telefonoWhatsApp: "51900000007",
    roles: ["VECINO"],
    predio: { manzana: "B", lote: "2", uso: "VIVIENDA", autos: 1 },
  },
  {
    nombreCompleto: "Elena Soto",
    dni: "40000008",
    telefonoWhatsApp: "51900000008",
    roles: ["VECINO"],
    predio: { manzana: "D", lote: "9", uso: "VIVIENDA", autos: 1, motos: 1 },
  },
  {
    nombreCompleto: "Víctor Salas",
    dni: "40000009",
    telefonoWhatsApp: "51900000009",
    roles: ["VECINO"],
    predio: { manzana: "B", lote: "11", uso: "VIVIENDA" },
  },
];

export function negarseEnNube(url = process.env.DATABASE_URL ?? "") {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV || /neon\.tech/.test(url)) {
    throw new Error("Las semillas ficticias solo corren en local o en el CI, nunca contra Neon.");
  }
}

export async function sembrar(claveEquipo = process.env.SEMILLA_CLAVE ?? "clave-de-prueba") {
  negarseEnNube();
  const credencial = await cifrarClave(claveEquipo);
  for (const { equipo, predio, ...persona } of PERSONAS) {
    const usuario = await prisma.usuario.upsert({
      where: { dni: persona.dni },
      create: persona,
      update: persona,
    });
    if (equipo) {
      await prisma.credencialRespaldo.upsert({
        where: { usuarioId: usuario.id },
        create: { usuarioId: usuario.id, ...credencial },
        update: { ...credencial, fallosSeguidos: 0, bloqueadaHasta: null },
      });
    }
    if (predio) {
      const { id: predioId } = await prisma.predio.upsert({
        where: { manzana_lote: { manzana: predio.manzana, lote: predio.lote } },
        create: predio,
        update: predio,
      });
      const vive = await prisma.residencia.count({ where: { usuarioId: usuario.id, fechaFin: null } });
      if (!vive)
        await prisma.residencia.create({ data: { usuarioId: usuario.id, predioId, relacion: "TITULAR" } });
    }
  }
  return PERSONAS.length;
}

if (require.main === module) {
  sembrar()
    .then((n) => console.log(`Semillas: ${n} personas ficticias.`))
    .catch((error: Error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
