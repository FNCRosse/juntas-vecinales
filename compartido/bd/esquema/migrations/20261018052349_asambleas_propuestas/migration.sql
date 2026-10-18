-- CreateEnum
CREATE TYPE "EstadoPropuesta" AS ENUM ('PENDIENTE_REVISION', 'INCLUIDA', 'NO_INCLUIDA');

-- CreateTable
CREATE TABLE "asambleas_propuestas" (
    "id" TEXT NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "justificacion" TEXT NOT NULL,
    "estado" "EstadoPropuesta" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "motivoDecision" TEXT,
    "decididaEn" TIMESTAMP(3),
    "decididaPor" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asambleas_propuestas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_propuestas_idOperacion_key" ON "asambleas_propuestas"("idOperacion");

-- CreateIndex
CREATE INDEX "asambleas_propuestas_convocatoriaId_creadaEn_idx" ON "asambleas_propuestas"("convocatoriaId", "creadaEn");

-- CreateIndex
CREATE INDEX "asambleas_propuestas_autorId_idx" ON "asambleas_propuestas"("autorId");

-- AddForeignKey
ALTER TABLE "asambleas_propuestas" ADD CONSTRAINT "asambleas_propuestas_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "asambleas_convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
