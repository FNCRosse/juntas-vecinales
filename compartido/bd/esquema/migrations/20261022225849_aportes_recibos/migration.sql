-- CreateEnum
CREATE TYPE "FranjaDeVisita" AS ENUM ('MANANA', 'TARDE', 'NOCHE');

-- CreateEnum
CREATE TYPE "EstadoPedidoRecibo" AS ENUM ('POR_ENTREGAR', 'ENTREGADO');

-- CreateTable
CREATE TABLE "aportes_recibos" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "pagoId" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "titular" TEXT NOT NULL,
    "vivienda" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "medio" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "registradoPor" TEXT NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "enviadoEn" TIMESTAMP(3),
    "confirmadoEn" TIMESTAMP(3),

    CONSTRAINT "aportes_recibos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aportes_pedidos_recibo_papel" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "reciboId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "franja" "FranjaDeVisita" NOT NULL,
    "nota" TEXT,
    "estado" "EstadoPedidoRecibo" NOT NULL DEFAULT 'POR_ENTREGAR',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entregadoEn" TIMESTAMP(3),
    "entregadoPorId" TEXT,

    CONSTRAINT "aportes_pedidos_recibo_papel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aportes_recibos_numero_key" ON "aportes_recibos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_recibos_pagoId_key" ON "aportes_recibos"("pagoId");

-- CreateIndex
CREATE INDEX "aportes_recibos_predioId_fecha_idx" ON "aportes_recibos"("predioId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_pedidos_recibo_papel_numero_key" ON "aportes_pedidos_recibo_papel"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_pedidos_recibo_papel_idOperacion_key" ON "aportes_pedidos_recibo_papel"("idOperacion");

-- CreateIndex
CREATE INDEX "aportes_pedidos_recibo_papel_estado_creadoEn_idx" ON "aportes_pedidos_recibo_papel"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "aportes_pedidos_recibo_papel_reciboId_estado_idx" ON "aportes_pedidos_recibo_papel"("reciboId", "estado");

-- AddForeignKey
ALTER TABLE "aportes_recibos" ADD CONSTRAINT "aportes_recibos_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "aportes_pagos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes_pedidos_recibo_papel" ADD CONSTRAINT "aportes_pedidos_recibo_papel_reciboId_fkey" FOREIGN KEY ("reciboId") REFERENCES "aportes_recibos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Un recibo emitido no se borra ni se modifica: solo se anota cuándo se envió a la app y cuándo la casa lo confirmó.
CREATE FUNCTION aportes_recibo_inalterable() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Un recibo emitido no se puede borrar';
  END IF;
  IF (to_jsonb(NEW) - 'enviadoEn' - 'confirmadoEn') IS DISTINCT FROM (to_jsonb(OLD) - 'enviadoEn' - 'confirmadoEn') THEN
    RAISE EXCEPTION 'Un recibo emitido no se puede modificar';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER aportes_recibos_inalterable
BEFORE UPDATE OR DELETE ON "aportes_recibos"
FOR EACH ROW EXECUTE FUNCTION aportes_recibo_inalterable();

-- Un recibo no tiene dos pedidos de papel por entregar a la vez.
CREATE UNIQUE INDEX "aportes_pedidos_recibo_papel_uno_por_entregar" ON "aportes_pedidos_recibo_papel"("reciboId") WHERE "estado" = 'POR_ENTREGAR';
