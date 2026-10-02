-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('AUTO_O_CAMIONETA', 'MOTO', 'TRICICLO_O_CARRETA');

-- CreateEnum
CREATE TYPE "TipoRegistroAcceso" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "ModoAcceso" AS ENUM ('VECINO_REJA', 'VECINO_A_MANO', 'EMERGENCIA', 'VISITA', 'NO_ENTRO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoVisita" ADD VALUE 'ESPERANDO_RESPUESTA';
ALTER TYPE "EstadoVisita" ADD VALUE 'AUTORIZADA';
ALTER TYPE "EstadoVisita" ADD VALUE 'NO_AUTORIZADA';
ALTER TYPE "EstadoVisita" ADD VALUE 'NO_ENTRO';

-- AlterTable
ALTER TABLE "identidad_visitas" ADD COLUMN     "anunciada" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "motivo" TEXT,
ADD COLUMN     "respondidaEn" TIMESTAMP(3),
ADD COLUMN     "respondidaPor" TEXT;

-- CreateTable
CREATE TABLE "identidad_vehiculos" (
    "id" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" "TipoVehiculo" NOT NULL,

    CONSTRAINT "identidad_vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identidad_registros_acceso" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoRegistroAcceso" NOT NULL,
    "modo" "ModoAcceso" NOT NULL,
    "quien" TEXT NOT NULL,
    "placa" TEXT,
    "vivienda" TEXT NOT NULL,
    "predioId" TEXT,
    "visitaId" TEXT,
    "entradaId" TEXT,
    "vigilanteId" TEXT NOT NULL,
    "detalle" TEXT,

    CONSTRAINT "identidad_registros_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identidad_vehiculos_placa_unica" ON "identidad_vehiculos"("placa");

-- CreateIndex
CREATE INDEX "identidad_registros_acceso_fecha_idx" ON "identidad_registros_acceso"("fecha");

-- Una sola salida por entrada (HU-GAR-08).
CREATE UNIQUE INDEX "identidad_registros_acceso_una_salida" ON "identidad_registros_acceso"("entradaId");

-- AddForeignKey
ALTER TABLE "identidad_vehiculos" ADD CONSTRAINT "identidad_vehiculos_predioId_fkey" FOREIGN KEY ("predioId") REFERENCES "identidad_predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Bitácora de solo inserción (HU-GAR-08 CA3): no se edita ni se borra, ni con TRUNCATE.
CREATE TRIGGER identidad_registros_acceso_solo_insercion
BEFORE UPDATE OR DELETE ON "identidad_registros_acceso"
FOR EACH ROW EXECUTE FUNCTION nucleo_rechazar_cambios();

CREATE TRIGGER identidad_registros_acceso_sin_truncate
BEFORE TRUNCATE ON "identidad_registros_acceso"
FOR EACH STATEMENT EXECUTE FUNCTION nucleo_rechazar_cambios();
