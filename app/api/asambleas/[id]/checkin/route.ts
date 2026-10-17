import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { buscarParaPaseDeLista, marcarCasaPresente } from "@/modulos/asambleas/aplicacion/checkin";

type Contexto = { params: Promise<{ id: string }> };
const esquema = z.object({ predioId: z.string().min(1) });

/** La directiva busca al vecino por nombre o DNI en el pase de lista (HU-ASA-07 CA1). */
export const GET = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const texto = new URL(peticion.url).searchParams.get("q") ?? "";
  return Response.json(await buscarParaPaseDeLista(sesion, (await params).id, texto));
});

/** Marca a una casa como presente el día de la asamblea (HU-ASA-07 CA1). */
export const POST = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { predioId } = esquema.parse(await leerJson(peticion));
  return Response.json(await marcarCasaPresente(sesion, (await params).id, predioId));
});
