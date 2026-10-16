import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import {
  diferenciaDeRoles,
  ROLES_DE_DIRECTIVA,
  textoDeRoles,
  verAdministrador,
  type RolDeDirectiva,
} from "@/modulos/identidad/aplicacion/equipo";
import { CambiarRoles } from "./CambiarRoles";

export const metadata: Metadata = { title: "Roles de directiva" };

// Cada subconjunto de roles de directiva, para mostrar lo que cambiaría respecto de los de hoy.
const subconjuntos = ROLES_DE_DIRECTIVA.reduce<RolDeDirectiva[][]>(
  (todos, rol) => [...todos, ...todos.map((s) => [...s, rol])],
  [[]],
);

// ADM-EQU-05 y ADM-EQU-06 para la cuenta de administración (HU-GAR-23).
export default async function CambiarRolesPagina({ params }: { params: Promise<{ usuarioId: string }> }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const miembro = await verAdministrador(sesion, (await params).usuarioId).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  const combinaciones = subconjuntos.map((roles) => ({
    roles,
    rolTexto: textoDeRoles(["ADMINISTRADOR", ...roles]),
    ...diferenciaDeRoles(miembro.rolesDeDirectiva, roles),
  }));
  return <CambiarRoles miembro={miembro} combinaciones={combinaciones} />;
}
