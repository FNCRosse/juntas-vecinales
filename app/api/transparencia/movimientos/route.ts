import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { registrarMovimiento } from "@/modulos/transparencia/aplicacion/caja";

const esquema = z.object({
  tipo: z.string(),
  monto: z.number({ error: "Escriba cuánto fue." }),
  concepto: z.string(),
  detalle: z.string().optional(),
  fecha: z.string().optional(),
  archivoId: z.string().optional(),
  idOperacion: z.uuid(),
});

/** Registrar un ingreso o un gasto de la caja de vigilancia (HU-COB-14), solo la directiva: 201; 200 si ya estaba registrado (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { movimiento, creado } = await registrarMovimiento(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(movimiento, { status: creado ? 201 : 200 });
});
