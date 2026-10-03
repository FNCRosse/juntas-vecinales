-- CreateEnum
CREATE TYPE "MedidaCorrectiva" AS ENUM ('MEDIACION', 'LLAMADA_DE_ATENCION', 'OTRA');

-- AlterTable
ALTER TABLE "incidencias_quejas" ADD COLUMN     "fechaCierre" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "incidencias_acciones_correctivas" (
    "id" TEXT NOT NULL,
    "quejaId" TEXT NOT NULL,
    "medida" "MedidaCorrectiva" NOT NULL,
    "detalle" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsableId" TEXT NOT NULL,

    CONSTRAINT "incidencias_acciones_correctivas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incidencias_acciones_correctivas_quejaId_idx" ON "incidencias_acciones_correctivas"("quejaId");

-- AddForeignKey
ALTER TABLE "incidencias_acciones_correctivas" ADD CONSTRAINT "incidencias_acciones_correctivas_quejaId_fkey" FOREIGN KEY ("quejaId") REFERENCES "incidencias_quejas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

