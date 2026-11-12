import { cifrarClave } from "../claves";
import { prisma } from "./cliente";

// Preparación de la base de la demo para el experimento de experiencia de usuario (R3.2, tesis):
// 1. da una clave a los 18 vecinos de demostración que nunca entraron (DNI 41000001 a 41000016, 41000101 y
//    41000102), uno por participante, para que cada uno vea la web como la primera vez;
// 2. cierra las convocatorias que quedaron con texto de prueba, para que los participantes no las vean.
// La corre la autora con la DATABASE_URL de producción y EXPERIMENTO_CLAVE en su terminal: la clave
// no se escribe en el repositorio. Sin `--aplicar` solo muestra lo que haría.

export const DNI_EXPERIMENTO = [
  ...Array.from({ length: 16 }, (_, i) => `410000${String(i + 1).padStart(2, "0")}`),
  "41000101",
  "41000102",
];

/** El mismo mínimo que la web pide a un vecino al crear su clave (credencialRespaldo.ts): la escribirá un adulto mayor. */
export const LARGO_MINIMO_CLAVE = 6;

/** Lugares de las convocatorias de prueba que se crearon a mano al recorrer el checklist de R3.1. */
export const LUGARES_DE_PRUEBA = ["En bjkebjs bsrbrw", "esvdsvsd", "Mz b lt 21"];

export async function prepararExperimento(
  entorno: Record<string, string | undefined> = process.env,
  aplicar = false,
) {
  const clave = entorno.EXPERIMENTO_CLAVE;
  if (!clave || clave.length < LARGO_MINIMO_CLAVE) {
    throw new Error(`Falta EXPERIMENTO_CLAVE (${LARGO_MINIMO_CLAVE} caracteres o más).`);
  }

  // Solo vecinos activos del rango de demostración: nunca se toca otra cuenta.
  const vecinos = await prisma.usuario.findMany({
    where: { dni: { in: DNI_EXPERIMENTO }, estado: "ACTIVA", roles: { has: "VECINO" } },
    select: { id: true, dni: true, nombreCompleto: true },
    orderBy: { dni: "asc" },
  });
  const convocatorias = await prisma.convocatoria.findMany({
    where: { lugar: { in: LUGARES_DE_PRUEBA }, estado: { not: "CERRADA" } },
    select: { id: true, titulo: true, lugar: true },
  });

  if (aplicar) {
    for (const v of vecinos) {
      const { hash, sal } = await cifrarClave(clave);
      await prisma.credencialRespaldo.upsert({
        where: { usuarioId: v.id },
        create: { usuarioId: v.id, hash, sal },
        update: { hash, sal, fallosSeguidos: 0, bloqueadaHasta: null },
      });
    }
    await prisma.convocatoria.updateMany({
      where: { id: { in: convocatorias.map((c) => c.id) } },
      data: { estado: "CERRADA" },
    });
  }
  return { vecinos, convocatorias };
}

if (require.main === module) {
  const aplicar = process.argv.includes("--aplicar");
  prepararExperimento(process.env, aplicar)
    .then(({ vecinos, convocatorias }) => {
      console.log(aplicar ? "Hecho:" : "Vista previa (agregue --aplicar para hacerlo):");
      console.log(`- clave para ${vecinos.length} vecinos de demostración:`);
      for (const v of vecinos) console.log(`    ${v.dni}  ${v.nombreCompleto}`);
      console.log(`- ${convocatorias.length} convocatorias de prueba cerradas:`);
      for (const c of convocatorias) console.log(`    ${c.titulo} (${c.lugar})`);
    })
    .catch((error: Error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
