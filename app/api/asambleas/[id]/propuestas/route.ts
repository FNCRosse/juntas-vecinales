import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { bandejaDePropuestas, misPropuestas, proponerTema } from "@/modulos/asambleas/aplicacion/propuestas";

type Contexto = { params: Promise<{ id: string }> };

const esquema = z.object({ titulo: z.string(), justificacion: z.string(), idOperacion: z.uuid() });

/** El vecino propone un tema para la agenda (HU-ASA-13): 201 al registrarlo; 200 si ya estaba (AC-5). */
export const POST = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { propuesta, creada } = await proponerTema(
    sesion,
    (await params).id,
    esquema.parse(await leerJson(peticion)),
  );
  return Response.json(propuesta, { status: creada ? 201 : 200 });
});

/** Las propuestas de la asamblea: la bandeja para la directiva; para el vecino, solo las suyas (AC-7). */
export const GET = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { id } = await params;
  const esDirectiva = sesion.roles.some((r) => r === "DIRECTIVA" || r === "DIRECTIVO_MEDIADOR");
  return Response.json(esDirectiva ? await bandejaDePropuestas(sesion, id) : await misPropuestas(sesion, id));
});
