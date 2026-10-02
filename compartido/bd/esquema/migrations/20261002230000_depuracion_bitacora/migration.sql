-- La bitácora de la garita sigue siendo de solo inserción (HU-GAR-08 CA3), pero se depura al año
-- (docs/DATOS.md §6): el trigger deja borrar solo filas de más de 365 días. UPDATE y TRUNCATE siguen
-- prohibidos.
CREATE FUNCTION identidad_bitacora_solo_insercion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.fecha < now() - interval '365 days' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'La tabla % solo admite inserciones', TG_TABLE_NAME;
END;
$$;

DROP TRIGGER identidad_registros_acceso_solo_insercion ON "identidad_registros_acceso";

CREATE TRIGGER identidad_registros_acceso_solo_insercion
BEFORE UPDATE OR DELETE ON "identidad_registros_acceso"
FOR EACH ROW EXECUTE FUNCTION identidad_bitacora_solo_insercion();
