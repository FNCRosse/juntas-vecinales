-- CreateTable
CREATE TABLE "aportes_alertas_preventivas" (
    "id" TEXT NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "diasDeRetraso" INTEGER NOT NULL,
    "debe" INTEGER NOT NULL,
    "residentesAvisados" INTEGER NOT NULL,
    "enviadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aportes_alertas_preventivas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aportes_alertas_preventivas_cuotaId_key" ON "aportes_alertas_preventivas"("cuotaId");

-- CreateIndex
CREATE INDEX "aportes_alertas_preventivas_predioId_enviadaEn_idx" ON "aportes_alertas_preventivas"("predioId", "enviadaEn");

-- La bitácora de recordatorios es de solo inserción (docs/DATOS.md §3).
CREATE TRIGGER aportes_alertas_preventivas_solo_insercion
BEFORE UPDATE OR DELETE ON "aportes_alertas_preventivas"
FOR EACH ROW EXECUTE FUNCTION nucleo_rechazar_cambios();
