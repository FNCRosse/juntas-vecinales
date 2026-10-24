import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { registrarCobroEnEfectivo } from "@/modulos/aportes/aplicacion/cobros";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  idOperacionLocal: z.uuid(),
  pedidoId: z.string(),
  monto: z.number().int(),
  reciboEnPapel: z.boolean(),
  registradoEn: z.string().optional(),
});

/**
 * Registra el efectivo que cobró la directiva en una casa (HU-COB-11). El teléfono lo manda al volver la señal y puede
 * reintentarlo: 201 la primera vez; 200 con el mismo resultado si ese `idOperacionLocal` ya estaba registrado (AC-5).
 */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const cobro = await registrarCobroEnEfectivo(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(cobro, { status: cobro.aplicado ? 201 : 200 });
});
