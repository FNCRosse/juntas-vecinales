import { z } from "zod";
import { pedirSubida } from "@/compartido/archivos/registro";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirRol, exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { USOS } from "./usos";

const esquema = z.object({
  uso: z.enum(Object.keys(USOS) as [keyof typeof USOS, ...(keyof typeof USOS)[]], {
    error: "No sabemos para qué es este archivo.",
  }),
  tipo: z.string(),
  tamano: z.number({ error: "No pudimos leer el tamaño del archivo." }),
});

/** Pide la URL firmada para subir un archivo directo a R2 (HU-ASA-10: comprobante de un gasto). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { uso, tipo, tamano } = esquema.parse(await leerJson(peticion));
  const regla = USOS[uso];
  exigirRol(sesion, ...regla.roles);
  const subida = await pedirSubida(sesion.usuarioId, { tipo, tamano }, { uso, ...regla });
  return Response.json(
    {
      id: subida.id,
      url: subida.url,
      metodo: subida.metodo,
      cabeceras: subida.cabeceras,
      venceEn: subida.venceEn,
    },
    { status: 201 },
  );
});
