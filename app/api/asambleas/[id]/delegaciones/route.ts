import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { anularDelegacion, delegarVoto } from "@/modulos/asambleas/aplicacion/delegaciones";

type Contexto = { params: Promise<{ id: string }> };

const esquema = z.object({
  nombre: z.string(),
  dni: z.string(),
  condicion: z.enum(["FAMILIAR", "VECINO", "EXTERNO"], { error: "Elija quién es para usted." }),
});

/** El titular delega el voto de su casa en un apoderado (HU-ASA-06): 201 al delegar; 200 si ya estaba (AC-5). */
export const POST = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { delegacion, creada } = await delegarVoto(
    sesion,
    (await params).id,
    esquema.parse(await leerJson(peticion)),
  );
  return Response.json(delegacion, { status: creada ? 201 : 200 });
});

/** El titular anula su delegación antes del plazo. */
export const DELETE = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  await anularDelegacion(sesion, (await params).id);
  return new Response(null, { status: 204 });
});
