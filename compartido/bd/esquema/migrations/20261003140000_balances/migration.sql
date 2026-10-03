-- Archivos en R2 y balances de actividades pro fondos (HU-ASA-10): el balance y sus gastos son inalterables.
-- AlterEnum
ALTER TYPE "TipoPublicacion" ADD VALUE 'BALANCE';

-- CreateTable
CREATE TABLE "nucleo_archivos" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "uso" TEXT NOT NULL,
    "subidoPor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nucleo_archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transparencia_balances" (
    "publicacionId" TEXT NOT NULL,
    "fechaActividad" TIMESTAMP(3) NOT NULL,
    "ingresosVirtuales" INTEGER NOT NULL,
    "ingresosEnPuerta" INTEGER NOT NULL,

    CONSTRAINT "transparencia_balances_pkey" PRIMARY KEY ("publicacionId")
);

-- CreateTable
CREATE TABLE "transparencia_egresos" (
    "id" TEXT NOT NULL,
    "balanceId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "archivoId" TEXT NOT NULL,

    CONSTRAINT "transparencia_egresos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nucleo_archivos_clave_key" ON "nucleo_archivos"("clave");

-- CreateIndex
CREATE INDEX "nucleo_archivos_subidoPor_idx" ON "nucleo_archivos"("subidoPor");

-- CreateIndex
CREATE INDEX "transparencia_egresos_balanceId_idx" ON "transparencia_egresos"("balanceId");

-- AddForeignKey
ALTER TABLE "transparencia_balances" ADD CONSTRAINT "transparencia_balances_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "transparencia_publicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transparencia_egresos" ADD CONSTRAINT "transparencia_egresos_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "transparencia_balances"("publicacionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transparencia_egresos" ADD CONSTRAINT "transparencia_egresos_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "nucleo_archivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


CREATE TRIGGER transparencia_balances_solo_insercion
BEFORE UPDATE OR DELETE ON "transparencia_balances"
FOR EACH ROW EXECUTE FUNCTION transparencia_solo_insercion();

CREATE TRIGGER transparencia_egresos_solo_insercion
BEFORE UPDATE OR DELETE ON "transparencia_egresos"
FOR EACH ROW EXECUTE FUNCTION transparencia_solo_insercion();
