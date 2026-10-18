-- CreateEnum
CREATE TYPE "EstadoVoluntariado" AS ENUM ('PENDIENTE', 'APROBADO', 'NO_APROBADO');

-- CreateTable
CREATE TABLE "asambleas_voluntarios" (
    "id" TEXT NOT NULL,
    "idOperacion" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoVoluntariado" NOT NULL DEFAULT 'PENDIENTE',
    "rolAsignado" TEXT,
    "decididoPor" TEXT,
    "decididoEn" TIMESTAMP(3),
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asambleas_voluntarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_voluntarios_idOperacion_key" ON "asambleas_voluntarios"("idOperacion");

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_voluntarios_convocatoriaId_predioId_key" ON "asambleas_voluntarios"("convocatoriaId", "predioId");

-- AddForeignKey
ALTER TABLE "asambleas_voluntarios" ADD CONSTRAINT "asambleas_voluntarios_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "asambleas_convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
