import { manejar } from "@/compartido/manejar";
import { buscarCasas } from "@/modulos/identidad/aplicacion/garita";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** A qué casa va la visita no anunciada: por nombre del vecino, manzana o lote (VIG-VIS-03). */
export const GET = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const texto = new URL(peticion.url).searchParams.get("texto") ?? "";
  return Response.json({ casas: await buscarCasas(sesion, texto) });
});
