import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { anotarEnActividad } from "@/modulos/transparencia/aplicacion/balances";

const esquema = z.object({
  tipo: z.string(),
  concepto: z.string(),
  monto: z.number({ error: "Escriba un monto en soles, por ejemplo 150.50." }).nullable(),
  archivoId: z.string().nullish(),
  idOperacion: z.uuid(),
});

/** Anota un gasto o lo cobrado en la puerta de una actividad pro fondos (HU-ASA-10): 201; 200 si ya estaba (AC-5). */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { movimiento, creado } = await anotarEnActividad(
    sesion,
    (await params).id,
    esquema.parse(await leerJson(peticion)),
  );
  return Response.json({ id: movimiento.id }, { status: creado ? 201 : 200 });
});
