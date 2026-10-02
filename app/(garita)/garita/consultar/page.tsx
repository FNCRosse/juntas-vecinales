import type { Metadata } from "next";
import { ConsultarGarita } from "./ConsultarGarita";

export const metadata: Metadata = { title: "Consultar vecino o placa" };

// VIG-CON-01 a 04: consulta con el semáforo, la lista guardada sin internet y la apertura por
// emergencia en dos pasos (HU-GAR-06). La sesión y el rol los exige el layout de la garita.
export default function Consultar() {
  return <ConsultarGarita />;
}
