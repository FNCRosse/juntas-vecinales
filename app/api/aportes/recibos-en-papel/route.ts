import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { pedirReciboEnPapel } from "@/modulos/aportes/aplicacion/recibos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  reciboId: z.string(),
  franja: z.string(),
  nota: z.string().optional(),
  idOperacion: z.uuid(),
});

/** La casa pide su recibo en papel (HU-COB-12): 201 al pedirlo; 200 si ese pedido ya estaba (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { pedido, creado } = await pedirReciboEnPapel(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(pedido, { status: creado ? 201 : 200 });
});
