-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('POLLADA', 'PARRILLADA', 'BINGO', 'RIFA', 'OTRA');

-- CreateEnum
CREATE TYPE "PagosDeActividad" AS ENUM ('AMBOS', 'ANTICIPADO', 'PUERTA');

-- CreateEnum
CREATE TYPE "ModalidadAporte" AS ENUM ('ANTICIPADA', 'EN_PUERTA');

-- CreateEnum
CREATE TYPE "EstadoColaboracion" AS ENUM ('POR_REVISAR', 'AGENDADA');

-- CreateTable
CREATE TABLE "asambleas_eventos" (
    "convocatoriaId" TEXT NOT NULL,
    "tipoActividad" "TipoActividad" NOT NULL,
    "precioUnidad" INTEGER NOT NULL,
    "metaRecaudacion" INTEGER,
    "pagos" "PagosDeActividad" NOT NULL,
    "pideVoluntarios" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "asambleas_eventos_pkey" PRIMARY KEY ("convocatoriaId")
);

-- CreateTable
CREATE TABLE "asambleas_colaboraciones" (
    "id" TEXT NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "modalidad" "ModalidadAporte" NOT NULL,
    "monto" INTEGER NOT NULL,
    "estado" "EstadoColaboracion" NOT NULL,
    "archivoId" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asambleas_colaboraciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_colaboraciones_idOperacion_key" ON "asambleas_colaboraciones"("idOperacion");

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_colaboraciones_convocatoriaId_predioId_key" ON "asambleas_colaboraciones"("convocatoriaId", "predioId");

-- AddForeignKey
ALTER TABLE "asambleas_eventos" ADD CONSTRAINT "asambleas_eventos_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "asambleas_convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asambleas_colaboraciones" ADD CONSTRAINT "asambleas_colaboraciones_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "asambleas_convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asambleas_colaboraciones" ADD CONSTRAINT "asambleas_colaboraciones_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "nucleo_archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
