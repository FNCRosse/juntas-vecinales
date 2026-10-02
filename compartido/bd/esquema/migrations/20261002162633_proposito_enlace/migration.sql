-- CreateEnum
CREATE TYPE "PropositoEnlace" AS ENUM ('ENTRADA', 'CLAVE');

-- AlterTable
ALTER TABLE "identidad_enlaces_acceso" ADD COLUMN     "proposito" "PropositoEnlace" NOT NULL DEFAULT 'ENTRADA';
