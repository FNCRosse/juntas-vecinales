-- CreateEnum
CREATE TYPE "SeccionGuia" AS ENUM ('INCIDENTES');

-- CreateEnum
CREATE TYPE "EstadoGuia" AS ENUM ('EN_CURSO', 'PAUSADA', 'OMITIDA', 'COMPLETADA');

-- CreateTable
CREATE TABLE "accesibilidad_guias" (
    "usuarioId" TEXT NOT NULL,
    "seccion" "SeccionGuia" NOT NULL,
    "estado" "EstadoGuia" NOT NULL,
    "paso" INTEGER NOT NULL DEFAULT 0,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accesibilidad_guias_pkey" PRIMARY KEY ("usuarioId","seccion")
);

