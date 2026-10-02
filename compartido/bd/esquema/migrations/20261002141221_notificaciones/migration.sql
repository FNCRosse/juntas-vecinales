-- CreateEnum
CREATE TYPE "EstadoEnvio" AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDA', 'SIN_CANAL_EXTERNO');

-- CreateTable
CREATE TABLE "nucleo_cola_avisos" (
    "id" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destinatarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "telefono" TEXT,
    "plantilla" TEXT,
    "parametros" TEXT[],
    "estado" "EstadoEnvio" NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "reintentarDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canal" TEXT,
    "enviadoEn" TIMESTAMP(3),
    "ultimoError" TEXT,

    CONSTRAINT "nucleo_cola_avisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nucleo_notificaciones" (
    "id" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destinatarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "leidaEn" TIMESTAMP(3),
    "avisoId" TEXT NOT NULL,

    CONSTRAINT "nucleo_notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nucleo_cola_avisos_estado_reintentarDesde_idx" ON "nucleo_cola_avisos"("estado", "reintentarDesde");

-- CreateIndex
CREATE UNIQUE INDEX "nucleo_notificaciones_avisoId_key" ON "nucleo_notificaciones"("avisoId");

-- CreateIndex
CREATE INDEX "nucleo_notificaciones_destinatarioId_creadaEn_idx" ON "nucleo_notificaciones"("destinatarioId", "creadaEn");

-- AddForeignKey
ALTER TABLE "nucleo_notificaciones" ADD CONSTRAINT "nucleo_notificaciones_avisoId_fkey" FOREIGN KEY ("avisoId") REFERENCES "nucleo_cola_avisos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
