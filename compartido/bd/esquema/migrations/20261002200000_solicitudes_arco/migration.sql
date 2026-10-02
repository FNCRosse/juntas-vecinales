-- CreateEnum
CREATE TYPE "TipoArco" AS ENUM ('ACCESO', 'RECTIFICACION', 'CANCELACION', 'OPOSICION');

-- CreateEnum
CREATE TYPE "EstadoArco" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'RESUELTA_SOLA');

-- CreateEnum
CREATE TYPE "CampoRectificable" AS ENUM ('NOMBRE', 'DNI', 'DIRECCION');

-- CreateTable
CREATE TABLE "identidad_solicitudes_arco" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" "TipoArco" NOT NULL,
    "estado" "EstadoArco" NOT NULL DEFAULT 'PENDIENTE',
    "campo" "CampoRectificable",
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "detalle" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaEn" TIMESTAMP(3),
    "resueltaPor" TEXT,
    "motivoResolucion" TEXT,

    CONSTRAINT "identidad_solicitudes_arco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identidad_solicitudes_arco_numero_key" ON "identidad_solicitudes_arco"("numero");

-- CreateIndex
CREATE INDEX "identidad_solicitudes_arco_estado_tipo_idx" ON "identidad_solicitudes_arco"("estado", "tipo");

-- CreateIndex
CREATE INDEX "identidad_solicitudes_arco_usuarioId_idx" ON "identidad_solicitudes_arco"("usuarioId");

-- AddForeignKey
ALTER TABLE "identidad_solicitudes_arco" ADD CONSTRAINT "identidad_solicitudes_arco_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "identidad_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

