-- CreateEnum
CREATE TYPE "EstadoPedidoCobro" AS ENUM ('PENDIENTE', 'COBRADO', 'CANCELADO');

-- AlterEnum
ALTER TYPE "MedioDePago" ADD VALUE 'EFECTIVO';

-- AlterTable
ALTER TABLE "aportes_pedidos_recibo_papel" ALTER COLUMN "franja" DROP NOT NULL;

-- CreateTable
CREATE TABLE "aportes_pedidos_cobro_en_casa" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "semanas" INTEGER NOT NULL,
    "monto" INTEGER NOT NULL,
    "franja" "FranjaDeVisita" NOT NULL,
    "nota" TEXT,
    "estado" "EstadoPedidoCobro" NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pagoId" TEXT,
    "cobradoEn" TIMESTAMP(3),

    CONSTRAINT "aportes_pedidos_cobro_en_casa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aportes_pedidos_cobro_en_casa_numero_key" ON "aportes_pedidos_cobro_en_casa"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_pedidos_cobro_en_casa_idOperacion_key" ON "aportes_pedidos_cobro_en_casa"("idOperacion");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_pedidos_cobro_en_casa_pagoId_key" ON "aportes_pedidos_cobro_en_casa"("pagoId");

-- CreateIndex
CREATE INDEX "aportes_pedidos_cobro_en_casa_estado_creadoEn_idx" ON "aportes_pedidos_cobro_en_casa"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "aportes_pedidos_cobro_en_casa_predioId_estado_idx" ON "aportes_pedidos_cobro_en_casa"("predioId", "estado");

-- Una casa tiene a lo más un pedido de cobro en casa pendiente.
CREATE UNIQUE INDEX "aportes_pedidos_cobro_en_casa_uno_pendiente" ON "aportes_pedidos_cobro_en_casa"("predioId") WHERE "estado" = 'PENDIENTE';
