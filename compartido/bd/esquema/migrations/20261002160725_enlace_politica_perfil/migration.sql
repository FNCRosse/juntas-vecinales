-- AlterTable
ALTER TABLE "identidad_usuarios" ADD COLUMN     "politicaAceptadaEn" TIMESTAMP(3),
ADD COLUMN     "politicaVersion" TEXT;

-- AddForeignKey
ALTER TABLE "accesibilidad_perfiles" ADD CONSTRAINT "accesibilidad_perfiles_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "identidad_usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
