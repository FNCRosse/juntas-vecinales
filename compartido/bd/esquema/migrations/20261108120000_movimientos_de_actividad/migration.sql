-- CreateEnum
CREATE TYPE "TipoMovimientoActividad" AS ENUM ('GASTO', 'INGRESO_EN_PUERTA');

-- CreateTable
CREATE TABLE "asambleas_movimientos_actividad" (
    "id" TEXT NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "tipo" "TipoMovimientoActividad" NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "archivoId" TEXT,
    "autorId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asambleas_movimientos_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_movimientos_actividad_idOperacion_key" ON "asambleas_movimientos_actividad"("idOperacion");

-- CreateIndex
CREATE INDEX "asambleas_movimientos_actividad_convocatoriaId_creadoEn_idx" ON "asambleas_movimientos_actividad"("convocatoriaId", "creadoEn");

-- Solo inserción (docs/DATOS.md §3): un movimiento mal anotado se corrige con otro, no se edita ni se borra.
CREATE FUNCTION asambleas_movimiento_actividad_inalterable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Un movimiento de una actividad no se modifica ni se borra';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER asambleas_movimientos_actividad_inalterable
  BEFORE UPDATE OR DELETE ON "asambleas_movimientos_actividad"
  FOR EACH ROW EXECUTE FUNCTION asambleas_movimiento_actividad_inalterable();
