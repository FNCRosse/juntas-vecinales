// @HU-QUE-01 @HU-QUE-02 @HU-QUE-03 @HU-QUE-04
import { prisma } from "@/compartido/bd/cliente";
import { direccion } from "@/modulos/identidad/dominio/predio";
import { VERSION_POLITICA } from "@/modulos/identidad/dominio/politica";

// Puerto para M3: lo que incidencias necesita saber del barrio y de las personas, sin leer las tablas
// de identidad (ARQUITECTURA §3).

/** La versión vigente de la política de privacidad: la que acepta quien registra una queja (HU-QUE-01 CA1). */
export const versionDePolitica = () => VERSION_POLITICA;

/** Las manzanas del padrón, en orden: son los lugares que se eligen al reportar. */
export async function manzanasDelBarrio() {
  const filas = await prisma.predio.findMany({
    distinct: ["manzana"],
    select: { manzana: true },
    orderBy: { manzana: "asc" },
  });
  return filas.map((f) => f.manzana);
}

/** La manzana donde vive hoy la persona, para "Cerca de mi casa"; null si no tiene residencia abierta. */
export async function manzanaDe(usuarioId: string) {
  const residencia = await prisma.residencia.findFirst({
    where: { usuarioId, fechaFin: null },
    select: { predio: { select: { manzana: true } } },
  });
  return residencia?.predio.manzana ?? null;
}

/** A quién avisar de un reporte nuevo (HU-QUE-04 CA2): la directiva y los mediadores activos. */
export async function directivaParaAvisar() {
  const personas = await prisma.usuario.findMany({
    where: { estado: "ACTIVA", roles: { hasSome: ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] } },
    select: { id: true },
    orderBy: { nombreCompleto: "asc" },
  });
  return personas.map((p) => p.id);
}

/** Nombres de las personas por su id, para mostrar quién reportó una queja con nombre. */
export async function nombresDe(ids: string[]) {
  const personas = await prisma.usuario.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombreCompleto: true },
  });
  return new Map(personas.map((p) => [p.id, p.nombreCompleto]));
}

const ROLES_DE_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR"] as const;
const conCasa = {
  residencias: { where: { fechaFin: null }, include: { predio: true }, take: 1 },
} as const;
type ConCasa = {
  id: string;
  nombreCompleto: string;
  residencias: { predio: { manzana: string; lote: string } }[];
};
const aVecino = (u: ConCasa) => ({
  id: u.id,
  nombre: u.nombreCompleto,
  casa: u.residencias[0] ? direccion(u.residencias[0].predio) : "Sin vivienda registrada",
});

/**
 * Vecinos activos que coinciden con lo escrito (HU-QUE-03, DIR-QUE-08): parte del nombre, el DNI o la
 * casa ("Mz. D", "D 4"). Hasta 8, sin DNI ni teléfono en el resultado.
 */
export async function buscarVecinos(texto: string) {
  const limpio = texto.trim();
  if (limpio.length < 2) return [];
  const casa = /^(?:mz\.?\s*)?([a-z])(?:[\s,]*(?:lote\s*)?(\w+))?$/i.exec(limpio);
  const personas = await prisma.usuario.findMany({
    where: {
      estado: "ACTIVA",
      roles: { hasSome: [...ROLES_DE_VECINO] },
      OR: [
        { nombreCompleto: { contains: limpio, mode: "insensitive" } },
        { dni: limpio },
        ...(casa
          ? [
              {
                residencias: {
                  some: {
                    fechaFin: null,
                    predio: { manzana: casa[1].toUpperCase(), ...(casa[2] && { lote: casa[2] }) },
                  },
                },
              },
            ]
          : []),
      ],
    },
    include: conCasa,
    orderBy: { nombreCompleto: "asc" },
    take: 8,
  });
  return personas.map(aVecino);
}

/** El vecino activo por su id, con su casa; null si no existe o ya no es vecino. */
export async function vecinoActivo(id: string) {
  const persona = await prisma.usuario.findFirst({
    where: { id, estado: "ACTIVA", roles: { hasSome: [...ROLES_DE_VECINO] } },
    include: conCasa,
  });
  return persona && aVecino(persona);
}

/** El WhatsApp de una persona activa, para avisarle de su reporte; null si no tiene o ya no está. */
export async function telefonoDe(id: string) {
  const persona = await prisma.usuario.findFirst({
    where: { id, estado: "ACTIVA" },
    select: { telefonoWhatsApp: true },
  });
  return persona?.telefonoWhatsApp ?? null;
}
