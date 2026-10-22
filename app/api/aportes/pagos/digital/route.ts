import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { registrarPagoDigital } from "@/modulos/aportes/aplicacion/pagos";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  semanas: z.number().int(),
  medio: z.string(),
  archivoId: z.string(),
  idOperacion: z.uuid(),
});

/** Manda el pago de la casa con la foto de su comprobante (HU-COB-08): 201 al registrarlo; 200 si ya estaba (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { pago, creado } = await registrarPagoDigital(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(pago, { status: creado ? 201 : 200 });
});
