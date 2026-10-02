-- CreateEnum
CREATE TYPE "UsoPredio" AS ENUM ('VIVIENDA', 'NEGOCIO', 'VIVIENDA_Y_NEGOCIO');

-- CreateEnum
CREATE TYPE "RelacionResidencia" AS ENUM ('TITULAR', 'CONYUGE', 'HIJO', 'PADRE', 'OTRO');

-- CreateTable
CREATE TABLE "identidad_predios" (
    "id" TEXT NOT NULL,
    "manzana" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "uso" "UsoPredio" NOT NULL,
    "familias" INTEGER NOT NULL DEFAULT 1,
    "inquilinos" INTEGER NOT NULL DEFAULT 0,
    "autos" INTEGER NOT NULL DEFAULT 0,
    "motos" INTEGER NOT NULL DEFAULT 0,
    "triciclos" INTEGER NOT NULL DEFAULT 0,
    "negocios" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identidad_predios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identidad_residencias" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "relacion" "RelacionResidencia" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),

    CONSTRAINT "identidad_residencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identidad_enlaces_acceso" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "emitidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "anuladoEn" TIMESTAMP(3),

    CONSTRAINT "identidad_enlaces_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identidad_predios_lote_unico" ON "identidad_predios"("manzana", "lote");

-- CreateIndex
CREATE INDEX "identidad_residencias_predioId_idx" ON "identidad_residencias"("predioId");

-- CreateIndex
CREATE INDEX "identidad_residencias_usuarioId_idx" ON "identidad_residencias"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "identidad_enlaces_acceso_tokenHash_key" ON "identidad_enlaces_acceso"("tokenHash");

-- CreateIndex
CREATE INDEX "identidad_enlaces_acceso_usuarioId_idx" ON "identidad_enlaces_acceso"("usuarioId");

-- AddForeignKey
ALTER TABLE "identidad_residencias" ADD CONSTRAINT "identidad_residencias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "identidad_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identidad_residencias" ADD CONSTRAINT "identidad_residencias_predioId_fkey" FOREIGN KEY ("predioId") REFERENCES "identidad_predios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identidad_enlaces_acceso" ADD CONSTRAINT "identidad_enlaces_acceso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "identidad_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
