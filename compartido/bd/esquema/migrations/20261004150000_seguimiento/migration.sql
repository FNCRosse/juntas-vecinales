-- CreateTable
CREATE TABLE "incidencias_consultas_seguimiento" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidencias_consultas_seguimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incidencias_consultas_seguimiento_ipHash_fecha_idx" ON "incidencias_consultas_seguimiento"("ipHash", "fecha");

