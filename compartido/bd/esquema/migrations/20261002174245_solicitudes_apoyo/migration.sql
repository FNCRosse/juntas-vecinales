-- CreateEnum
CREATE TYPE "ModoApoyo" AS ENUM ('LLAMADA', 'WHATSAPP', 'VISITA');

-- CreateEnum
CREATE TYPE "EstadoApoyo" AS ENUM ('PENDIENTE', 'EN_ATENCION', 'ATENDIDA');

-- CreateTable
CREATE TABLE "accesibilidad_solicitudes_apoyo" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "quien" TEXT NOT NULL,
    "pantalla" TEXT NOT NULL,
    "modo" "ModoApoyo" NOT NULL,
    "detalle" TEXT,
    "estado" "EstadoApoyo" NOT NULL DEFAULT 'PENDIENTE',
    "atendidaPor" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cambiadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accesibilidad_solicitudes_apoyo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accesibilidad_solicitudes_apoyo_numero_key" ON "accesibilidad_solicitudes_apoyo"("numero");

-- CreateIndex
CREATE INDEX "accesibilidad_solicitudes_apoyo_usuarioId_idx" ON "accesibilidad_solicitudes_apoyo"("usuarioId");

-- CreateIndex
CREATE INDEX "accesibilidad_solicitudes_apoyo_estado_creadaEn_idx" ON "accesibilidad_solicitudes_apoyo"("estado", "creadaEn");
