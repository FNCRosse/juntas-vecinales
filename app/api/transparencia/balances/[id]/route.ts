import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { verBalance } from "@/modulos/transparencia/aplicacion/balances";

/** Un balance publicado, con sus gastos y totales (HU-ASA-12 CA2). */
export const GET = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) =>
  Response.json(await verBalance(await exigirSesion(peticion), (await params).id)),
);
