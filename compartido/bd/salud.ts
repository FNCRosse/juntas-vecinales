import { prisma } from "./cliente";

/** Responde si la base de datos acepta consultas. */
export async function comprobarBaseDatos(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
