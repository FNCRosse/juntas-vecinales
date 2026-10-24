-- CreateEnum
CREATE TYPE "MotivoReclamo" AS ENUM ('SIN_INQUILINO', 'MENOS_VEHICULOS', 'YA_PAGUE', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoReclamo" AS ENUM ('EN_REVISION', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "aportes_ajustes" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "motivo" "MotivoReclamo" NOT NULL,
    "detalle" TEXT,
    "archivoId" TEXT,
    "estado" "EstadoReclamo" NOT NULL DEFAULT 'EN_REVISION',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aportes_ajustes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aportes_ajuste_cuotas" (
    "id" TEXT NOT NULL,
    "reclamoId" TEXT NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "estadoAnterior" "EstadoCuota" NOT NULL,

    CONSTRAINT "aportes_ajuste_cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aportes_ajustes_numero_key" ON "aportes_ajustes"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_ajustes_idOperacion_key" ON "aportes_ajustes"("idOperacion");

-- CreateIndex
CREATE INDEX "aportes_ajustes_predioId_estado_idx" ON "aportes_ajustes"("predioId", "estado");

-- CreateIndex
CREATE INDEX "aportes_ajustes_estado_creadoEn_idx" ON "aportes_ajustes"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "aportes_ajuste_cuotas_cuotaId_idx" ON "aportes_ajuste_cuotas"("cuotaId");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_ajuste_cuotas_reclamoId_cuotaId_key" ON "aportes_ajuste_cuotas"("reclamoId", "cuotaId");

-- AddForeignKey
ALTER TABLE "aportes_ajuste_cuotas" ADD CONSTRAINT "aportes_ajuste_cuotas_reclamoId_fkey" FOREIGN KEY ("reclamoId") REFERENCES "aportes_ajustes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Una casa tiene a lo más un reclamo en revisión.
CREATE UNIQUE INDEX "aportes_ajustes_uno_en_revision" ON "aportes_ajustes"("predioId") WHERE "estado" = 'EN_REVISION';
