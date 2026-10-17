import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import {
  anularAsistenciaAsistida,
  buscarParaAsistencia,
  registrarAsistenciaAsistida,
} from "@/modulos/asambleas/aplicacion/convocatorias";

type Contexto = { params: Promise<{ id: string }> };
const esquema = z.object({ predioId: z.string().min(1) });

/** El mediador busca al vecino por nombre o DNI (HU-ASA-03 CA1). */
export const GET = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const texto = new URL(peticion.url).searchParams.get("q") ?? "";
  return Response.json(await buscarParaAsistencia(sesion, (await params).id, texto));
});

/** El mediador asienta la confirmación del vecino, gestionada en persona (HU-ASA-03 CA2). */
export const POST = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { predioId } = esquema.parse(await leerJson(peticion));
  return Response.json(await registrarAsistenciaAsistida(sesion, (await params).id, predioId));
});

/** El mediador anula un registro suyo. */
export const DELETE = manejar<Contexto>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { predioId } = esquema.parse(await leerJson(peticion));
  return Response.json(await anularAsistenciaAsistida(sesion, (await params).id, predioId));
});
