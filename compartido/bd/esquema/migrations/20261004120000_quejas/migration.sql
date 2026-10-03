-- CreateEnum
CREATE TYPE "CategoriaQueja" AS ENUM ('RUIDOS', 'BASURA', 'COCHERAS', 'SEGURIDAD', 'OTROS');

-- CreateEnum
CREATE TYPE "EstadoQueja" AS ENUM ('RECIBIDO', 'EN_REVISION', 'RECHAZADO', 'RESUELTO', 'DERIVADO_ENTIDAD_EXTERNA');

-- CreateTable
CREATE TABLE "incidencias_quejas" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "codigoTicket" TEXT NOT NULL,
    "categoria" "CategoriaQueja" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "manzana" TEXT,
    "referencia" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "estado" "EstadoQueja" NOT NULL DEFAULT 'RECIBIDO',
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "denuncianteId" TEXT NOT NULL,
    "consentimientoVersion" TEXT NOT NULL,
    "consentimientoEn" TIMESTAMP(3) NOT NULL,
    "idOperacion" TEXT NOT NULL,

    CONSTRAINT "incidencias_quejas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidencias_evidencias" (
    "id" TEXT NOT NULL,
    "quejaId" TEXT NOT NULL,
    "archivoId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "incidencias_evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incidencias_quejas_numero_key" ON "incidencias_quejas"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "incidencias_quejas_codigoTicket_key" ON "incidencias_quejas"("codigoTicket");

-- CreateIndex
CREATE UNIQUE INDEX "incidencias_quejas_idOperacion_key" ON "incidencias_quejas"("idOperacion");

-- CreateIndex
CREATE INDEX "incidencias_quejas_denuncianteId_idx" ON "incidencias_quejas"("denuncianteId");

-- CreateIndex
CREATE INDEX "incidencias_quejas_estado_fechaRegistro_idx" ON "incidencias_quejas"("estado", "fechaRegistro");

-- CreateIndex
CREATE INDEX "incidencias_evidencias_quejaId_idx" ON "incidencias_evidencias"("quejaId");

-- AddForeignKey
ALTER TABLE "incidencias_evidencias" ADD CONSTRAINT "incidencias_evidencias_quejaId_fkey" FOREIGN KEY ("quejaId") REFERENCES "incidencias_quejas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias_evidencias" ADD CONSTRAINT "incidencias_evidencias_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "nucleo_archivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

