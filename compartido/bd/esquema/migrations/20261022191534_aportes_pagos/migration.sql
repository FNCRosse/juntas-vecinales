-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('REGISTRADO', 'APROBADO', 'OBSERVADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoComprobante" AS ENUM ('PENDIENTE_REVISION', 'APROBADO', 'OBSERVADO');

-- CreateEnum
CREATE TYPE "MotivoObservacion" AS ENUM ('MONTO_INSUFICIENTE', 'IMAGEN_BORROSA', 'FECHA_ERRONEA');

-- CreateEnum
CREATE TYPE "MedioDePago" AS ENUM ('YAPE_O_PLIN', 'TRANSFERENCIA');

-- CreateTable
CREATE TABLE "aportes_pagos" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "medio" "MedioDePago" NOT NULL,
    "monto" INTEGER NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'REGISTRADO',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aportes_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aportes_pago_cuotas" (
    "id" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "cuotaId" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,

    CONSTRAINT "aportes_pago_cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aportes_comprobantes" (
    "id" TEXT NOT NULL,
    "pagoId" TEXT NOT NULL,
    "archivoId" TEXT NOT NULL,
    "estado" "EstadoComprobante" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "motivoObservacion" "MotivoObservacion",
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aportes_comprobantes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aportes_pagos_numero_key" ON "aportes_pagos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_pagos_idOperacion_key" ON "aportes_pagos"("idOperacion");

-- CreateIndex
CREATE INDEX "aportes_pagos_predioId_creadoEn_idx" ON "aportes_pagos"("predioId", "creadoEn");

-- CreateIndex
CREATE INDEX "aportes_pagos_estado_creadoEn_idx" ON "aportes_pagos"("estado", "creadoEn");

-- CreateIndex
CREATE INDEX "aportes_pago_cuotas_cuotaId_idx" ON "aportes_pago_cuotas"("cuotaId");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_pago_cuotas_pagoId_cuotaId_key" ON "aportes_pago_cuotas"("pagoId", "cuotaId");

-- CreateIndex
CREATE INDEX "aportes_comprobantes_pagoId_idx" ON "aportes_comprobantes"("pagoId");

-- AddForeignKey
ALTER TABLE "aportes_pago_cuotas" ADD CONSTRAINT "aportes_pago_cuotas_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "aportes_pagos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes_comprobantes" ADD CONSTRAINT "aportes_comprobantes_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "aportes_pagos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
