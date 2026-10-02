import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { NOMBRE_ROL, PERMISOS, PERMISOS_POR_ROL, ROLES_EQUIPO } from "@/modulos/identidad/aplicacion/equipo";
import { AgregarAlEquipo } from "./AgregarAlEquipo";

export const metadata: Metadata = { title: "Agregar al equipo" };

// ADM-EQU-02 a ADM-EQU-04 (HU-GAR-21).
export default async function Agregar() {
  await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const roles = ROLES_EQUIPO.map((rol) => ({
    rol,
    nombre: NOMBRE_ROL[rol],
    puede: [...PERMISOS_POR_ROL[rol]],
    noPuede: PERMISOS.filter((p) => !PERMISOS_POR_ROL[rol].includes(p)),
  }));
  return <AgregarAlEquipo roles={roles} />;
}
