-- Actas digitales (HU-ASA-11): inalterables como el resto de las publicaciones.
-- AlterEnum
ALTER TYPE "TipoPublicacion" ADD VALUE 'ACTA';

-- CreateTable
CREATE TABLE "transparencia_actas" (
    "publicacionId" TEXT NOT NULL,
    "fechaAsamblea" TIMESTAMP(3) NOT NULL,
    "acuerdos" TEXT[],
    "compromisos" TEXT[],
    "conclusiones" TEXT NOT NULL,

    CONSTRAINT "transparencia_actas_pkey" PRIMARY KEY ("publicacionId")
);

-- AddForeignKey
ALTER TABLE "transparencia_actas" ADD CONSTRAINT "transparencia_actas_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "transparencia_publicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


CREATE TRIGGER transparencia_actas_solo_insercion
BEFORE UPDATE OR DELETE ON "transparencia_actas"
FOR EACH ROW EXECUTE FUNCTION transparencia_solo_insercion();
