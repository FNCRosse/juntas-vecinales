-- CreateEnum
CREATE TYPE "EstadoCuota" AS ENUM ('PENDIENTE', 'EN_DISCREPANCIA', 'PAGADA', 'VENCIDA');

-- CreateTable
CREATE TABLE "aportes_cuotas" (
    "id" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "periodo" TIMESTAMP(3) NOT NULL,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "tarifaId" TEXT NOT NULL,
    "montoCalculado" INTEGER NOT NULL,
    "saldoPendiente" INTEGER NOT NULL,
    "estado" "EstadoCuota" NOT NULL DEFAULT 'PENDIENTE',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aportes_cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aportes_cuota_conceptos" (
    "id" TEXT NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" "UnidadCobro" NOT NULL,
    "montoUnitario" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "aportes_cuota_conceptos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "aportes_cuotas_predioId_estado_idx" ON "aportes_cuotas"("predioId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_cuotas_predioId_periodo_key" ON "aportes_cuotas"("predioId", "periodo");

-- AddForeignKey
ALTER TABLE "aportes_cuota_conceptos" ADD CONSTRAINT "aportes_cuota_conceptos_cuotaId_fkey" FOREIGN KEY ("cuotaId") REFERENCES "aportes_cuotas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Solo inserción (docs/DATOS.md §3): la copia de lo que se cobró en una cuota no se edita ni se borra.
CREATE TRIGGER aportes_cuota_conceptos_solo_insercion
BEFORE UPDATE OR DELETE ON "aportes_cuota_conceptos"
FOR EACH ROW EXECUTE FUNCTION nucleo_rechazar_cambios();
