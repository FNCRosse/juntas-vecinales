import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import {
  abrirPorEmergencia,
  anotarEntradaVecino,
  anotarEntradaVisita,
  anotarNoEntro,
  marcarSalida,
  registrarLlegada,
} from "@/modulos/identidad/aplicacion/garita";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const vecino = {
  predioId: z.string().min(1),
  quien: z.string().trim().min(1).max(120),
  placa: z.string().trim().max(10).nullish(),
};

const esquema = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("entrada_vecino"), ...vecino }),
  z.object({
    accion: z.literal("emergencia"),
    ...vecino,
    motivo: z.enum(["SALUD", "SEGURIDAD", "OTRO"], { message: "Elija qué pasa." }),
  }),
  z.object({ accion: z.literal("llegada_anunciada"), visitaId: z.string().min(1) }),
  z.object({ accion: z.literal("entrada_visita"), visitaId: z.string().min(1) }),
  z.object({ accion: z.literal("no_entro"), visitaId: z.string().min(1) }),
  z.object({ accion: z.literal("salida"), entradaId: z.string().min(1) }),
]);

/** Anotar en la bitácora de la garita: entradas, salidas y visitas que no entraron (HU-GAR-08). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const cuerpo = esquema.parse(await leerJson(peticion));
  switch (cuerpo.accion) {
    case "entrada_vecino":
      return Response.json(await anotarEntradaVecino(sesion, cuerpo), { status: 201 });
    case "emergencia":
      return Response.json(await abrirPorEmergencia(sesion, cuerpo), { status: 201 });
    case "llegada_anunciada":
      return Response.json(await registrarLlegada(sesion, cuerpo.visitaId), { status: 201 });
    case "entrada_visita":
      return Response.json(await anotarEntradaVisita(sesion, cuerpo.visitaId), { status: 201 });
    case "no_entro":
      return Response.json(await anotarNoEntro(sesion, cuerpo.visitaId), { status: 201 });
    case "salida":
      return Response.json(await marcarSalida(sesion, cuerpo.entradaId), { status: 201 });
  }
});
