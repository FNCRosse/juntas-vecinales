import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { guiaDeSeccion } from "@/modulos/accesibilidad/aplicacion/guias";
import { GuiaDeSeccion } from "./GuiaDeSeccion";

export const metadata: Metadata = { title: "Guía de la sección" };

// VEC-ACC-08 aplicada a una sección (HU-ACC-10): la guía opcional de Incidentes. `?desde=inicio` la
// vuelve a empezar (desde Ayuda y accesibilidad).
export default async function Guia({
  params,
  searchParams,
}: {
  params: Promise<{ seccion: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const seccion = (await params).seccion.toUpperCase();
  const guia = await guiaDeSeccion(sesion.usuarioId, seccion).catch((e) => {
    if (e instanceof ErrorNoEncontrado) notFound();
    throw e;
  });
  const desdeElInicio = (await searchParams).desde === "inicio";
  return (
    <GuiaDeSeccion guia={guia} pasoInicial={desdeElInicio || guia.estado === "COMPLETADA" ? 0 : guia.paso} />
  );
}
