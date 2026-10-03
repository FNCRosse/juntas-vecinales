import type { Metadata } from "next";
import { sesionActual } from "@/app/_sesion/sesion";
import { BuscarConCodigo } from "./BuscarConCodigo";

export const metadata: Metadata = { title: "Buscar con mi código" };

// VEC-QUE-09 (HU-QUE-09): funciona sin sesión; con sesión, vuelve a Incidentes.
export default async function Seguimiento() {
  const sesion = await sesionActual();
  return (
    <BuscarConCodigo
      volver={
        sesion
          ? { href: "/incidentes", texto: "Volver a Incidentes" }
          : { href: "/entrar", texto: "Volver a la entrada" }
      }
    />
  );
}
