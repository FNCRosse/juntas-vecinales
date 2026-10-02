import { z } from "zod";
import { desdeHoraDeLima } from "@/compartido/fechas";
import { leerJson, manejar } from "@/compartido/manejar";
import { registrarVisita } from "@/modulos/identidad/aplicacion/visitas";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  nombre: z.string().trim().min(1, "Falta el nombre de la visita.").max(120),
  dni: z
    .string()
    .trim()
    .regex(/^(\d{8})?$/, "El DNI tiene 8 números. Si no lo sabe, déjelo vacío.")
    .optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elija la fecha de la visita."),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Elija la hora de llegada."),
  conVehiculo: z.boolean(),
  placa: z.string().trim().max(10, "La placa tiene como mucho 7 caracteres.").optional(),
});

/** Registrar una visita en la lista blanca de la garita (HU-GAR-04). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { fecha, hora, ...datos } = esquema.parse(await leerJson(peticion));
  return Response.json(await registrarVisita(sesion, { ...datos, desde: desdeHoraDeLima(fecha, hora) }), {
    status: 201,
  });
});
