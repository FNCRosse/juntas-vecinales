-- CreateEnum
CREATE TYPE "CondicionApoderado" AS ENUM ('FAMILIAR', 'VECINO', 'EXTERNO');

-- CreateTable
CREATE TABLE "asambleas_delegaciones" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "titularId" TEXT NOT NULL,
    "apoderadoNombre" TEXT NOT NULL,
    "apoderadoDniHash" TEXT NOT NULL,
    "apoderadoDniFinal" TEXT NOT NULL,
    "condicion" "CondicionApoderado" NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asambleas_delegaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_delegaciones_numero_key" ON "asambleas_delegaciones"("numero");

-- CreateIndex
CREATE INDEX "asambleas_delegaciones_convocatoriaId_apoderadoDniHash_idx" ON "asambleas_delegaciones"("convocatoriaId", "apoderadoDniHash");

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_delegaciones_convocatoriaId_predioId_key" ON "asambleas_delegaciones"("convocatoriaId", "predioId");

-- AddForeignKey
ALTER TABLE "asambleas_delegaciones" ADD CONSTRAINT "asambleas_delegaciones_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "asambleas_convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
