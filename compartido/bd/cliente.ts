import { PrismaPg } from "@prisma/adapter-pg";
import { type Prisma, PrismaClient } from "./generado/client";

// Una sola instancia por proceso; en desarrollo sobrevive a la recarga en caliente de Next.
const global = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  global.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

/** Cliente de una transacción: lo reciben los casos de uso y el núcleo para escribir en la misma (ADR-007). */
export type Transaccion = Prisma.TransactionClient;
