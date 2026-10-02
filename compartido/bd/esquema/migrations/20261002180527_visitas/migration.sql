-- CreateEnum
CREATE TYPE "EstadoGarita" AS ENUM ('VERDE', 'ROJO');

-- CreateEnum
CREATE TYPE "EstadoVisita" AS ENUM ('PROGRAMADA', 'ANULADA', 'LLEGO');

-- AlterTable
ALTER TABLE "identidad_predios" ADD COLUMN     "estadoGarita" "EstadoGarita" NOT NULL DEFAULT 'VERDE';

-- CreateTable
CREATE TABLE "identidad_visitas" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "predioId" TEXT NOT NULL,
    "registradaPor" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dni" TEXT,
    "desde" TIMESTAMP(3) NOT NULL,
    "hasta" TIMESTAMP(3) NOT NULL,
    "conVehiculo" BOOLEAN NOT NULL DEFAULT false,
    "placa" TEXT,
    "estado" "EstadoVisita" NOT NULL DEFAULT 'PROGRAMADA',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anuladaEn" TIMESTAMP(3),
    "llegoEn" TIMESTAMP(3),

    CONSTRAINT "identidad_visitas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identidad_visitas_numero_key" ON "identidad_visitas"("numero");

-- CreateIndex
CREATE INDEX "identidad_visitas_predioId_estado_idx" ON "identidad_visitas"("predioId", "estado");

-- CreateIndex
CREATE INDEX "identidad_visitas_estado_desde_idx" ON "identidad_visitas"("estado", "desde");

-- AddForeignKey
ALTER TABLE "identidad_visitas" ADD CONSTRAINT "identidad_visitas_predioId_fkey" FOREIGN KEY ("predioId") REFERENCES "identidad_predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
