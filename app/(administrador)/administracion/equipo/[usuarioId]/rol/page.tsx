import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import {
  diferenciaDePermisos,
  NOMBRE_ROL,
  ROLES_EQUIPO,
  verMiembro,
} from "@/modulos/identidad/aplicacion/equipo";
import { CambiarRol } from "./CambiarRol";

export const metadata: Metadata = { title: "Cambiar rol" };

// ADM-EQU-05 y ADM-EQU-06 (HU-GAR-23).
export default async function CambiarRolPagina({ params }: { params: Promise<{ usuarioId: string }> }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const miembro = await verMiembro(sesion, (await params).usuarioId).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  const opciones = ROLES_EQUIPO.map((rol) => ({
    rol,
    nombre: NOMBRE_ROL[rol],
    ...diferenciaDePermisos(miembro.rol, rol),
  }));
  return <CambiarRol miembro={miembro} opciones={opciones} />;
}
