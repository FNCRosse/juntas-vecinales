import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { ofrecerAyuda, voluntariosDeLaActividad } from "@/modulos/asambleas/aplicacion/voluntarios";

type Contexto = { params: Promise<{ id: string }> };

const esquema = z.object({ descripcion: z.string(), idOperacion: z.uuid() });

/** Una casa ofrece su ayuda como voluntaria (HU-ASA-09): 201 al ofrecerla; 200 si ya estaba (AC-5). */
export const POST = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { voluntariado, creado } = await ofrecerAyuda(
    sesion,
    (await params).id,
    esquema.parse(await leerJson(peticion)),
  );
  return Response.json(voluntariado, { status: creado ? 201 : 200 });
});

/** Los ofrecimientos de ayuda de la actividad, para la directiva (DIR-ASA-12). */
export const GET = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  return Response.json(await voluntariosDeLaActividad(sesion, (await params).id));
});
