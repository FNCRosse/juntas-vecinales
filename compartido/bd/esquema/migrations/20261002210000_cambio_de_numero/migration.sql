-- AlterEnum
ALTER TYPE "CampoRectificable" ADD VALUE 'WHATSAPP';

-- AlterTable
ALTER TABLE "identidad_solicitudes_arco" ADD COLUMN     "verificacion" TEXT;

-- AlterTable
ALTER TABLE "nucleo_cola_avisos" ADD COLUMN     "conCopiaInterna" BOOLEAN NOT NULL DEFAULT true;

