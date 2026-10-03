-- CreateEnum
CREATE TYPE "EntidadExterna" AS ENUM ('PNP', 'MUNICIPALIDAD');

-- CreateTable
CREATE TABLE "incidencias_expedientes" (
    "quejaId" TEXT NOT NULL,
    "entidad" "EntidadExterna" NOT NULL,
    "numeroOficio" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsableId" TEXT NOT NULL,

    CONSTRAINT "incidencias_expedientes_pkey" PRIMARY KEY ("quejaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "incidencias_expedientes_numeroOficio_key" ON "incidencias_expedientes"("numeroOficio");

-- AddForeignKey
ALTER TABLE "incidencias_expedientes" ADD CONSTRAINT "incidencias_expedientes_quejaId_fkey" FOREIGN KEY ("quejaId") REFERENCES "incidencias_quejas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

