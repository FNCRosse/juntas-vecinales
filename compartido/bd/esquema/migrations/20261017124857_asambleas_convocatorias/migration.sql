-- CreateEnum
CREATE TYPE "TipoConvocatoria" AS ENUM ('ASAMBLEA', 'EVENTO_PRO_FONDOS');

-- CreateEnum
CREATE TYPE "EstadoConvocatoria" AS ENUM ('BORRADOR', 'PUBLICADA', 'REPROGRAMADA', 'INFORMATIVA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoAsamblea" AS ENUM ('ORDINARIA', 'EXTRAORDINARIA');

-- CreateTable
CREATE TABLE "asambleas_convocatorias" (
    "id" TEXT NOT NULL,
    "tipo" "TipoConvocatoria" NOT NULL,
    "titulo" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoConvocatoria" NOT NULL DEFAULT 'PUBLICADA',
    "autorId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "fechaPublicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idOperacion" TEXT NOT NULL,

    CONSTRAINT "asambleas_convocatorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asambleas_asambleas" (
    "convocatoriaId" TEXT NOT NULL,
    "tipoAsamblea" "TipoAsamblea" NOT NULL,
    "padronTotal" INTEGER NOT NULL,
    "quorumRequerido" INTEGER NOT NULL,
    "confirmacionesHasta" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asambleas_asambleas_pkey" PRIMARY KEY ("convocatoriaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_convocatorias_idOperacion_key" ON "asambleas_convocatorias"("idOperacion");

-- CreateIndex
CREATE INDEX "asambleas_convocatorias_fechaHora_idx" ON "asambleas_convocatorias"("fechaHora");

-- AddForeignKey
ALTER TABLE "asambleas_asambleas" ADD CONSTRAINT "asambleas_asambleas_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "asambleas_convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
