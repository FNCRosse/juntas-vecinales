-- Un recibo emitido sigue sin poder modificarse ni borrarse, con una sola excepción: el nombre de quien lo pagó (titular) o de
-- quien lo cobró (registradoPor) puede pasar a «Persona anonimizada» cuando esa persona cancela su cuenta (Ley N.° 29733,
-- HU-GAR-14). El monto, el correlativo, la fecha y el concepto, que son el registro contable, no cambian.
CREATE OR REPLACE FUNCTION aportes_recibo_inalterable() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Un recibo emitido no se puede borrar';
  END IF;
  IF (to_jsonb(NEW) - 'enviadoEn' - 'confirmadoEn' - 'titular' - 'registradoPor')
       IS DISTINCT FROM (to_jsonb(OLD) - 'enviadoEn' - 'confirmadoEn' - 'titular' - 'registradoPor')
     OR (NEW.titular IS DISTINCT FROM OLD.titular AND NEW.titular <> 'Persona anonimizada')
     OR (NEW."registradoPor" IS DISTINCT FROM OLD."registradoPor" AND NEW."registradoPor" <> 'Persona anonimizada') THEN
    RAISE EXCEPTION 'Un recibo emitido no se puede modificar';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
