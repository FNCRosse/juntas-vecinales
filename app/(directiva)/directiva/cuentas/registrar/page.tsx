import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { conceptosDeCaja } from "@/modulos/transparencia/aplicacion/caja";
import { RegistrarMovimiento } from "./RegistrarMovimiento";

export const metadata: Metadata = { title: "Registrar un ingreso o gasto" };

// DIR-TRA-03 y DIR-TRA-04 (HU-COB-14): registrar lo que entra y sale de la caja de vigilancia además de las cuotas, en dos pasos.
// Solo la directiva.
export default async function Registrar() {
  await exigirActor(["DIRECTIVA"], "/entrar/equipo");
  return <RegistrarMovimiento conceptos={conceptosDeCaja()} />;
}
