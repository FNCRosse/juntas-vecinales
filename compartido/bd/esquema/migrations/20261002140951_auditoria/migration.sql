-- CreateTable
CREATE TABLE "nucleo_auditoria" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "antes" JSONB,
    "despues" JSONB,

    CONSTRAINT "nucleo_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nucleo_auditoria_entidad_entidadId_idx" ON "nucleo_auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "nucleo_auditoria_fecha_idx" ON "nucleo_auditoria"("fecha");

-- Solo inserción (HU-GAR-26 CA3, docs/DATOS.md §3): la auditoría no se edita ni se borra.
CREATE FUNCTION nucleo_rechazar_cambios() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'La tabla % solo admite inserciones', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER nucleo_auditoria_solo_insercion
BEFORE UPDATE OR DELETE ON "nucleo_auditoria"
FOR EACH ROW EXECUTE FUNCTION nucleo_rechazar_cambios();

CREATE TRIGGER nucleo_auditoria_sin_truncate
BEFORE TRUNCATE ON "nucleo_auditoria"
FOR EACH STATEMENT EXECUTE FUNCTION nucleo_rechazar_cambios();
