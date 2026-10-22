-- CreateEnum
CREATE TYPE "UnidadCobro" AS ENUM ('POR_FAMILIA', 'POR_VEHICULO', 'POR_INQUILINO', 'POR_LOCAL');

-- CreateEnum
CREATE TYPE "TipoCambioTarifa" AS ENUM ('INICIAL', 'AGREGAR', 'CAMBIAR');

-- CreateTable
CREATE TABLE "aportes_tarifas" (
    "id" TEXT NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "vigenciaDesde" TIMESTAMP(3) NOT NULL,
    "acta" TEXT NOT NULL,
    "tipoCambio" "TipoCambioTarifa" NOT NULL,
    "cambioClave" TEXT,
    "cambioNombre" TEXT,
    "cambioUnidad" "UnidadCobro",
    "montoAnterior" INTEGER,
    "montoNuevo" INTEGER,
    "autorId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aportes_tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aportes_conceptos_tarifa" (
    "id" TEXT NOT NULL,
    "tarifaId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" "UnidadCobro" NOT NULL,
    "monto" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "aportes_conceptos_tarifa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aportes_tarifas_idOperacion_key" ON "aportes_tarifas"("idOperacion");

-- CreateIndex
CREATE INDEX "aportes_tarifas_vigenciaDesde_creadaEn_idx" ON "aportes_tarifas"("vigenciaDesde", "creadaEn");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_conceptos_tarifa_tarifaId_clave_key" ON "aportes_conceptos_tarifa"("tarifaId", "clave");

-- AddForeignKey
ALTER TABLE "aportes_conceptos_tarifa" ADD CONSTRAINT "aportes_conceptos_tarifa_tarifaId_fkey" FOREIGN KEY ("tarifaId") REFERENCES "aportes_tarifas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Solo inserción (HU-COB-16 CA3, docs/DATOS.md §3): el historial de tarifas no se edita ni se borra.
CREATE TRIGGER aportes_tarifas_solo_insercion
BEFORE UPDATE OR DELETE ON "aportes_tarifas"
FOR EACH ROW EXECUTE FUNCTION nucleo_rechazar_cambios();

CREATE TRIGGER aportes_conceptos_tarifa_solo_insercion
BEFORE UPDATE OR DELETE ON "aportes_conceptos_tarifa"
FOR EACH ROW EXECUTE FUNCTION nucleo_rechazar_cambios();
