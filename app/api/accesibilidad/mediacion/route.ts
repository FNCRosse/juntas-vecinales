import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { solicitarApoyo } from "@/modulos/accesibilidad/aplicacion/mediacion";
import { mediadoresDeTurno, quienPideAyuda } from "@/modulos/identidad/aplicacion/datosParaAyuda";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.object({
  pantalla: z.string().trim().min(1).max(80),
  modo: z.enum(["LLAMADA", "WHATSAPP", "VISITA"], { error: "Elija cómo prefiere que le ayuden." }),
  detalle: z.string().trim().max(500, "Escriba menos de 500 letras.").optional(),
});

/** Pedir ayuda a una persona (HU-ACC-04). app/ compone quién pide y a quién avisar (ARQUITECTURA §3). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { pantalla, modo, detalle } = esquema.parse(await leerJson(peticion));
  const { quien } = await quienPideAyuda(sesion);
  const pedido = await solicitarApoyo(
    { usuarioId: sesion.usuarioId, quien, pantalla, modo, detalle: detalle || undefined },
    await mediadoresDeTurno(),
  );
  return Response.json(pedido, { status: 201 });
});
