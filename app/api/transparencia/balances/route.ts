import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { balancesPublicados, publicarBalance } from "@/modulos/transparencia/aplicacion/balances";

const esquema = z.object({
  titulo: z.string(),
  fechaActividad: z.string(),
  ingresosVirtuales: z.number({ error: "Escriba un monto en soles, por ejemplo 150.50." }),
  ingresosEnPuerta: z.number({ error: "Escriba un monto en soles, por ejemplo 150.50." }),
  egresos: z.array(z.object({ concepto: z.string(), monto: z.number(), archivoId: z.string() })).max(60),
  idOperacion: z.uuid(),
});

/** Publicar el balance de una actividad pro fondos (HU-ASA-10): 201; 200 si ya estaba publicado (AC-5). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { balance, creado } = await publicarBalance(sesion, esquema.parse(await leerJson(peticion)));
  return Response.json(balance, { status: creado ? 201 : 200 });
});

/** Los balances publicados, los más nuevos primero. */
export const GET = manejar(async (peticion) =>
  Response.json(await balancesPublicados(await exigirSesion(peticion))),
);
