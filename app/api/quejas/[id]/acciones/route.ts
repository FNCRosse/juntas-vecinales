import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { resolverQueja } from "@/modulos/incidencias/aplicacion/gestion";

const esquema = z.object({ medida: z.string().nullish(), detalle: z.string().nullish() });

/** Registrar lo que se hizo y cerrar el reporte como resuelto (HU-QUE-06). */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) =>
  Response.json(
    await resolverQueja(
      await exigirSesion(peticion),
      (await params).id,
      esquema.parse(await leerJson(peticion)),
    ),
    { status: 201 },
  ),
);
