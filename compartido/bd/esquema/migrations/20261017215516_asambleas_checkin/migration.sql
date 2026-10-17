-- AlterTable
ALTER TABLE "asambleas_asambleas" ADD COLUMN     "votacionesAbiertasEn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "asambleas_delegaciones" ADD COLUMN     "validadaEn" TIMESTAMP(3),
ADD COLUMN     "validadaPor" TEXT;

-- CreateTable
CREATE TABLE "asambleas_checkins" (
    "id" TEXT NOT NULL,
    "convocatoriaId" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "acreditadoPor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asambleas_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asambleas_checkins_convocatoriaId_predioId_key" ON "asambleas_checkins"("convocatoriaId", "predioId");

-- AddForeignKey
ALTER TABLE "asambleas_checkins" ADD CONSTRAINT "asambleas_checkins_convocatoriaId_fkey" FOREIGN KEY ("convocatoriaId") REFERENCES "asambleas_convocatorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
