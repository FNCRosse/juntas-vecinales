-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVA', 'SUSPENDIDA', 'DESVINCULADA');

-- CreateEnum
CREATE TYPE "NombreRol" AS ENUM ('VECINO', 'VECINO_ADULTO_MAYOR', 'DIRECTIVA', 'DIRECTIVO_MEDIADOR', 'VIGILANTE', 'ADMINISTRADOR');

-- CreateTable
CREATE TABLE "identidad_usuarios" (
    "id" TEXT NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "telefonoWhatsApp" TEXT,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVA',
    "roles" "NombreRol"[],
    "fechaEmpadronamiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identidad_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identidad_sesiones" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoUsoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocadaEn" TIMESTAMP(3),

    CONSTRAINT "identidad_sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identidad_credenciales" (
    "usuarioId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "sal" TEXT NOT NULL,
    "fallosSeguidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadaHasta" TIMESTAMP(3),
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identidad_credenciales_pkey" PRIMARY KEY ("usuarioId")
);

-- CreateIndex
CREATE UNIQUE INDEX "identidad_usuarios_dni_unico" ON "identidad_usuarios"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "identidad_sesiones_tokenHash_key" ON "identidad_sesiones"("tokenHash");

-- CreateIndex
CREATE INDEX "identidad_sesiones_usuarioId_idx" ON "identidad_sesiones"("usuarioId");

-- AddForeignKey
ALTER TABLE "identidad_sesiones" ADD CONSTRAINT "identidad_sesiones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "identidad_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identidad_credenciales" ADD CONSTRAINT "identidad_credenciales_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "identidad_usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
