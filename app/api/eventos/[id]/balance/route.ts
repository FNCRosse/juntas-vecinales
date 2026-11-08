import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { publicarBalanceDeActividad } from "@/modulos/transparencia/aplicacion/balances";

const esquema = z.object({ idOperacion: z.uuid() });

/** Publica el balance de una actividad con lo anotado (HU-ASA-10 CA3): 201; 200 si ya estaba publicado (AC-5). */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { idOperacion } = esquema.parse(await leerJson(peticion));
  const { balance, creado } = await publicarBalanceDeActividad(sesion, (await params).id, idOperacion);
  return Response.json(balance, { status: creado ? 201 : 200 });
});
