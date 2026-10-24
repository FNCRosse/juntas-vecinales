import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { pedirCobroEnCasa } from "@/modulos/aportes/aplicacion/cobros";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  semanas: z.number().int(),
  franja: z.string(),
  nota: z.string().optional(),
  idOperacion: z.uuid(),
});

/** La casa pide que la directiva vaya a cobrarle en efectivo (HU-COB-11): 201 al pedirlo; 200 si ese pedido ya estaba (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { pedido, creado } = await pedirCobroEnCasa(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(pedido, { status: creado ? 201 : 200 });
});
