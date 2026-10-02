-- CreateEnum
CREATE TYPE "TipoAviso" AS ENUM ('CUENTA', 'SEGURIDAD', 'PAGOS', 'ASAMBLEAS', 'REPORTES', 'GARITA', 'NOTICIAS');

-- AlterTable
ALTER TABLE "nucleo_cola_avisos" ADD COLUMN     "tipo" "TipoAviso" NOT NULL DEFAULT 'CUENTA';

-- AlterTable
ALTER TABLE "nucleo_notificaciones" ADD COLUMN     "tipo" "TipoAviso" NOT NULL DEFAULT 'CUENTA';

-- CreateTable
CREATE TABLE "nucleo_preferencias_aviso" (
    "usuarioId" TEXT NOT NULL,
    "whatsapp" BOOLEAN NOT NULL DEFAULT true,
    "pagos" BOOLEAN NOT NULL DEFAULT true,
    "asambleas" BOOLEAN NOT NULL DEFAULT true,
    "reportes" BOOLEAN NOT NULL DEFAULT true,
    "garita" BOOLEAN NOT NULL DEFAULT true,
    "noticias" BOOLEAN NOT NULL DEFAULT false,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nucleo_preferencias_aviso_pkey" PRIMARY KEY ("usuarioId")
);
