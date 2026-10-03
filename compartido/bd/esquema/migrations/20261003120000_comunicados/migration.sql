-- Publicaciones de la junta (M2): inalterables, una vez emitidas no se modifican ni se borran (docs/DATOS.md §3).
-- CreateEnum
CREATE TYPE "TipoPublicacion" AS ENUM ('COMUNICADO');

-- CreateEnum
CREATE TYPE "NivelUrgencia" AS ENUM ('INFORMATIVO', 'URGENTE');

-- CreateTable
CREATE TABLE "transparencia_publicaciones" (
    "id" TEXT NOT NULL,
    "tipo" "TipoPublicacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "fechaPublicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "corrigeAId" TEXT,
    "idOperacion" TEXT NOT NULL,

    CONSTRAINT "transparencia_publicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transparencia_comunicados" (
    "publicacionId" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "urgencia" "NivelUrgencia" NOT NULL,

    CONSTRAINT "transparencia_comunicados_pkey" PRIMARY KEY ("publicacionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "transparencia_publicaciones_idOperacion_key" ON "transparencia_publicaciones"("idOperacion");

-- CreateIndex
CREATE INDEX "transparencia_publicaciones_fechaPublicacion_idx" ON "transparencia_publicaciones"("fechaPublicacion");

-- AddForeignKey
ALTER TABLE "transparencia_publicaciones" ADD CONSTRAINT "transparencia_publicaciones_corrigeAId_fkey" FOREIGN KEY ("corrigeAId") REFERENCES "transparencia_publicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transparencia_comunicados" ADD CONSTRAINT "transparencia_comunicados_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "transparencia_publicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


CREATE FUNCTION transparencia_solo_insercion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'La tabla % solo admite inserciones', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER transparencia_publicaciones_solo_insercion
BEFORE UPDATE OR DELETE ON "transparencia_publicaciones"
FOR EACH ROW EXECUTE FUNCTION transparencia_solo_insercion();

CREATE TRIGGER transparencia_comunicados_solo_insercion
BEFORE UPDATE OR DELETE ON "transparencia_comunicados"
FOR EACH ROW EXECUTE FUNCTION transparencia_solo_insercion();
