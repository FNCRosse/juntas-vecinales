-- AlterTable
ALTER TABLE "incidencias_quejas" ADD COLUMN     "esAnonimo" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "denuncianteId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "incidencias_identidades_protegidas" (
    "quejaId" TEXT NOT NULL,
    "hashDenunciante" TEXT NOT NULL,
    "datosCifrados" TEXT NOT NULL,

    CONSTRAINT "incidencias_identidades_protegidas_pkey" PRIMARY KEY ("quejaId")
);

-- CreateIndex
CREATE INDEX "incidencias_identidades_protegidas_hashDenunciante_idx" ON "incidencias_identidades_protegidas"("hashDenunciante");

-- AddForeignKey
ALTER TABLE "incidencias_identidades_protegidas" ADD CONSTRAINT "incidencias_identidades_protegidas_quejaId_fkey" FOREIGN KEY ("quejaId") REFERENCES "incidencias_quejas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Una queja anónima nunca guarda a su denunciante a la vista; una con nombre siempre lo guarda (R-09).
ALTER TABLE "incidencias_quejas" ADD CONSTRAINT "incidencias_quejas_anonimato"
  CHECK ("esAnonimo" = ("denuncianteId" IS NULL));
