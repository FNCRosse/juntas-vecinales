import { cifrarClave } from "../claves";
import { prisma } from "./cliente";
import type { NombreRol, Prisma, TipoCambioTarifa, TipoVehiculo, UnidadCobro } from "./generado/client";

// Semillas ficticias (docs/DATOS.md §5): solo en local y en el CI. Nunca en Neon: las previews son
// copias de producción y una clave conocida daría acceso a ellas.

type Persona = {
  nombreCompleto: string;
  dni: string;
  telefonoWhatsApp: string;
  roles: NombreRol[];
  equipo?: boolean;
  /** Predio donde es titular (docs/DATOS.md §5), con sus vehículos (placas inventadas). */
  predio?: Omit<Prisma.PredioCreateInput, "residencias" | "vehiculos">;
  vehiculos?: { placa: string; tipo: TipoVehiculo }[];
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
    predio: { manzana: "A", lote: "3", uso: "VIVIENDA", autos: 1, estadoGarita: "ROJO" },
    vehiculos: [{ placa: "JLM-314", tipo: "AUTO_O_CAMIONETA" }],
  },
  {
    nombreCompleto: "Rosa Díaz",
    dni: "40000007",
    telefonoWhatsApp: "51900000007",
    roles: ["VECINO"],
    predio: { manzana: "B", lote: "2", uso: "VIVIENDA", autos: 1 },
    vehiculos: [{ placa: "CDF-220", tipo: "AUTO_O_CAMIONETA" }],
  },
  {
    nombreCompleto: "Elena Soto",
    dni: "40000008",
    telefonoWhatsApp: "51900000008",
    roles: ["VECINO"],
    predio: { manzana: "D", lote: "9", uso: "VIVIENDA", autos: 1, motos: 1 },
    vehiculos: [
      { placa: "EDS-108", tipo: "AUTO_O_CAMIONETA" },
      { placa: "ESM-021", tipo: "MOTO" },
    ],
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

type ConceptoSemilla = { clave: string; nombre: string; unidad: UnidadCobro; monto: number };

const CASA = { clave: "casa", nombre: "Casa", unidad: "POR_FAMILIA", monto: 250 } as const;
const INQUILINO = { clave: "inquilino", nombre: "Inquilino", unidad: "POR_INQUILINO", monto: 250 } as const;
const AUTO = { clave: "auto", nombre: "Auto o camioneta", unidad: "POR_VEHICULO", monto: 200 } as const;
const MOTO = { clave: "moto", nombre: "Moto", unidad: "POR_VEHICULO", monto: 100 } as const;
const TRICICLO = {
  clave: "triciclo",
  nombre: "Triciclo o carreta",
  unidad: "POR_VEHICULO",
  monto: 50,
} as const;
const NEGOCIO = { clave: "negocio", nombre: "Negocio", unidad: "POR_LOCAL", monto: 250 } as const;

/**
 * La tarifa del prototipo (HU-COB-16): una inicial y dos cambios que ya rigen, para que la pantalla tenga historial.
 * Solo si todavía no hay ninguna versión; en producción la primera la registra la directiva.
 */
async function sembrarTarifa(autorId: string, autor: string) {
  if (await prisma.tarifa.count()) return;
  const versiones: {
    idOperacion: string;
    vigenciaDesde: string;
    creadaEn: string;
    acta: string;
    tipoCambio: TipoCambioTarifa;
    cambio?: { concepto: ConceptoSemilla; montoAnterior: number | null };
    conceptos: ConceptoSemilla[];
  }[] = [
    {
      idOperacion: "semilla-tarifa-0",
      vigenciaDesde: "2025-09-01T05:00:00Z",
      creadaEn: "2025-08-30T15:00:00Z",
      acta: "Acta de asamblea del 30 de agosto de 2025",
      tipoCambio: "INICIAL",
      conceptos: [CASA, INQUILINO, AUTO, MOTO, { ...NEGOCIO }],
    },
    {
      idOperacion: "semilla-tarifa-1",
      vigenciaDesde: "2026-01-05T05:00:00Z",
      creadaEn: "2025-12-20T15:00:00Z",
      acta: "Acta de asamblea del 20 de diciembre de 2025",
      tipoCambio: "AGREGAR",
      cambio: { concepto: TRICICLO, montoAnterior: null },
      conceptos: [CASA, INQUILINO, AUTO, MOTO, TRICICLO, { ...NEGOCIO }],
    },
    {
      idOperacion: "semilla-tarifa-2",
      vigenciaDesde: "2026-04-06T05:00:00Z",
      creadaEn: "2026-03-28T15:00:00Z",
      acta: "Acta de asamblea del 28 de marzo de 2026",
      tipoCambio: "CAMBIAR",
      cambio: { concepto: { ...NEGOCIO, monto: 300 }, montoAnterior: 250 },
      conceptos: [CASA, INQUILINO, AUTO, MOTO, TRICICLO, { ...NEGOCIO, monto: 300 }],
    },
  ];
  for (const v of versiones) {
    await prisma.tarifa.create({
      data: {
        idOperacion: v.idOperacion,
        vigenciaDesde: new Date(v.vigenciaDesde),
        creadaEn: new Date(v.creadaEn),
        acta: v.acta,
        tipoCambio: v.tipoCambio,
        cambioClave: v.cambio?.concepto.clave,
        cambioNombre: v.cambio?.concepto.nombre,
        cambioUnidad: v.cambio?.concepto.unidad,
        montoAnterior: v.cambio?.montoAnterior,
        montoNuevo: v.cambio?.concepto.monto,
        autorId,
        autor,
        conceptos: { create: v.conceptos.map((c, orden) => ({ ...c, orden })) },
      },
    });
  }
}

export async function sembrar(claveEquipo = process.env.SEMILLA_CLAVE ?? "clave-de-prueba") {
  negarseEnNube();
  const credencial = await cifrarClave(claveEquipo);
  for (const { equipo, predio, vehiculos = [], ...persona } of PERSONAS) {
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
      for (const vehiculo of vehiculos) {
        await prisma.vehiculo.upsert({
          where: { placa: vehiculo.placa },
          create: { ...vehiculo, predioId },
          update: { predioId },
        });
      }
    }
  }
  const marta = await prisma.usuario.findUniqueOrThrow({ where: { dni: "40000002" } });
  await sembrarTarifa(marta.id, marta.nombreCompleto);
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
