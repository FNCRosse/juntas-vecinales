-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'GASTO');

-- CreateTable
CREATE TABLE "transparencia_movimientos_caja" (
    "id" TEXT NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "concepto" TEXT NOT NULL,
    "detalle" TEXT,
    "monto" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "archivoId" TEXT,
    "autorId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transparencia_movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transparencia_rendiciones" (
    "id" TEXT NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "ingresosPorCuotas" INTEGER NOT NULL,
    "ingresosOtros" INTEGER NOT NULL,
    "gastos" INTEGER NOT NULL,
    "comprobantes" INTEGER NOT NULL,
    "gastosPorConcepto" JSONB NOT NULL,
    "publicadaPorId" TEXT NOT NULL,
    "publicadaPor" TEXT NOT NULL,
    "publicadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transparencia_rendiciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transparencia_movimientos_caja_idOperacion_key" ON "transparencia_movimientos_caja"("idOperacion");

-- CreateIndex
CREATE INDEX "transparencia_movimientos_caja_fecha_idx" ON "transparencia_movimientos_caja"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "transparencia_rendiciones_idOperacion_key" ON "transparencia_rendiciones"("idOperacion");

-- CreateIndex
CREATE UNIQUE INDEX "transparencia_rendiciones_mes_key" ON "transparencia_rendiciones"("mes");

-- Solo inserción: un movimiento de caja y una rendición publicada no se modifican ni se borran. Un error se corrige con otro
-- movimiento; una rendición publicada es la de ese mes para siempre.
CREATE FUNCTION transparencia_cuentas_solo_insercion() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Este registro de cuentas no se puede modificar ni borrar';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transparencia_movimientos_caja_solo_insercion
BEFORE UPDATE OR DELETE ON "transparencia_movimientos_caja"
FOR EACH ROW EXECUTE FUNCTION transparencia_cuentas_solo_insercion();

CREATE TRIGGER transparencia_rendiciones_solo_insercion
BEFORE UPDATE OR DELETE ON "transparencia_rendiciones"
FOR EACH ROW EXECUTE FUNCTION transparencia_cuentas_solo_insercion();
