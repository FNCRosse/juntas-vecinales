-- AlterTable
ALTER TABLE "aportes_ajuste_cuotas" ADD COLUMN     "montoAnterior" INTEGER,
ADD COLUMN     "montoNuevo" INTEGER;

-- AlterTable
ALTER TABLE "aportes_ajustes" ADD COLUMN     "conceptoAjustado" TEXT,
ADD COLUMN     "decididoEn" TIMESTAMP(3),
ADD COLUMN     "decididoPorId" TEXT,
ADD COLUMN     "respuesta" TEXT;
