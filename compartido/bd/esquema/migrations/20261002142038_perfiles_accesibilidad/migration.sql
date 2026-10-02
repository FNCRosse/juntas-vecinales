-- CreateEnum
CREATE TYPE "EscalaTipografica" AS ENUM ('NORMAL', 'GRANDE', 'MUY_GRANDE');

-- CreateTable
CREATE TABLE "accesibilidad_perfiles" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "modoSeniorActivo" BOOLEAN NOT NULL DEFAULT false,
    "escalaTipografica" "EscalaTipografica" NOT NULL DEFAULT 'NORMAL',
    "altoContrasteActivo" BOOLEAN NOT NULL DEFAULT false,
    "sintesisVozActiva" BOOLEAN NOT NULL DEFAULT false,
    "confirmacionEnDosPasosActiva" BOOLEAN NOT NULL DEFAULT true,
    "areaTactilAmpliada" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accesibilidad_perfiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accesibilidad_perfiles_usuarioId_key" ON "accesibilidad_perfiles"("usuarioId");
