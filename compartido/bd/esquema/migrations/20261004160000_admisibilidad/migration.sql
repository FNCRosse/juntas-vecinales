-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- AlterTable
ALTER TABLE "incidencias_quejas" ADD COLUMN     "evaluadaPor" TEXT,
ADD COLUMN     "fechaEvaluacion" TIMESTAMP(3),
ADD COLUMN     "motivoRechazo" TEXT,
ADD COLUMN     "prioridad" "Prioridad";

