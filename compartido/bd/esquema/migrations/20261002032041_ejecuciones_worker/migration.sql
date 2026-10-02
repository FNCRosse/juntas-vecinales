-- CreateEnum
CREATE TYPE "ResultadoEjecucion" AS ENUM ('EXITOSA', 'FALLIDA');

-- CreateTable
CREATE TABLE "nucleo_ejecuciones_worker" (
    "id" TEXT NOT NULL,
    "iniciadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminadaEn" TIMESTAMP(3),
    "resultado" "ResultadoEjecucion" NOT NULL,
    "detalle" TEXT,

    CONSTRAINT "nucleo_ejecuciones_worker_pkey" PRIMARY KEY ("id")
);
