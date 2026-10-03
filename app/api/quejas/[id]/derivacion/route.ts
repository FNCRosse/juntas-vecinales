import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { derivarQueja } from "@/modulos/incidencias/aplicacion/derivacion";

const esquema = z.object({ entidad: z.string().nullish() });

/** Derivar el reporte a la PNP o la Municipalidad con su expediente y oficio (HU-QUE-07). */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) =>
  Response.json(
    await derivarQueja(
      await exigirSesion(peticion),
      (await params).id,
      esquema.parse(await leerJson(peticion)),
    ),
    { status: 201 },
  ),
);
