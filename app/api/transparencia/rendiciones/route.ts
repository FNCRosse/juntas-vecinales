import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { publicarRendicion } from "@/modulos/transparencia/aplicacion/caja";

const esquema = z.object({ mes: z.string(), idOperacion: z.uuid() });

/** Publicar la rendición de cuentas de un mes (HU-COB-14), solo la directiva: 201; 200 si ya estaba publicada con ese pedido; 409 si el mes ya se publicó. */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { rendicion, creada } = await publicarRendicion(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(rendicion, { status: creada ? 201 : 200 });
});
