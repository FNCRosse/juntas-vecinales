-- AlterEnum
ALTER TYPE "MotivoObservacion" ADD VALUE 'OTRO';

-- AlterTable
ALTER TABLE "aportes_comprobantes" ADD COLUMN     "nota" TEXT;
