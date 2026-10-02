import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { preguntarAlVecino } from "@/modulos/identidad/aplicacion/garita";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  nombre: z.string().trim().min(1, "Falta el nombre de la visita.").max(120),
  dni: z
    .string()
    .trim()
    .regex(/^(\d{8})?$/, "El DNI tiene 8 números. Si no lo sabe, déjelo vacío.")
    .optional(),
  predioId: z.string().min(1, "Elija a qué casa va."),
  motivo: z.string().trim().min(1, "Escriba a qué viene.").max(200),
  conVehiculo: z.boolean(),
  placa: z.string().trim().max(10, "La placa tiene como mucho 7 caracteres.").optional(),
});

/** Visita no anunciada: preguntar a la casa si la deja pasar (HU-GAR-07 CA2). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const datos = esquema.parse(await leerJson(peticion));
  const origen = process.env.URL_PUBLICA || new URL(peticion.url).origin;
  return Response.json(await preguntarAlVecino(sesion, datos, origen), { status: 201 });
});
