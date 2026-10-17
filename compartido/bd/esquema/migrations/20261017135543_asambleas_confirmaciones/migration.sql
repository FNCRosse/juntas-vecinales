-- CreateEnum
CREATE TYPE "ModoConfirmacion" AS ENUM ('DIGITAL', 'ASISTIDA');

-- CreateTable
CREATE TABLE "asambleas_confirmaciones" (
    "id" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "modo" "ModoConfirmacion" NOT NULL,
    "registradaPor" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asambleas_confirmaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asambleas_confirmaciones_convocatoriaId_idx" ON "asambleas_confirmaciones"("convocatoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_confirmaciones_convocatoriaId_predioId_key" ON "asambleas_confirmaciones"("convocatoriaId", "predioId");

-- AddForeignKey
ALTER TABLE "asambleas_confirmaciones" ADD CONSTRAINT "asambleas_confirmaciones_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "asambleas_convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
