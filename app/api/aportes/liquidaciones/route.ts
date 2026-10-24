import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { liquidarDeuda } from "@/modulos/aportes/aplicacion/liquidaciones";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  predioId: z.string(),
  medio: z.string(),
  numeroOperacion: z.string().optional(),
  idOperacion: z.uuid(),
});

/**
 * Registra el pago de toda la deuda acumulada de una casa y la pone al día (HU-COB-07), solo la directiva: 201 al
 * registrarlo; 200 con lo mismo si ese `idOperacion` ya estaba registrado (AC-5).
 */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const liquidada = await liquidarDeuda(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(liquidada, { status: liquidada.aplicado ? 201 : 200 });
});
