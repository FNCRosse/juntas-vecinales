import type { Metadata } from "next";
import { TextoDePolitica } from "@/app/_privacidad/TextoDePolitica";

export const metadata: Metadata = { title: "Política de privacidad" };

// Política de privacidad completa (Ley N.° 29733 y su reglamento; docs/DATOS.md §6): el texto está en TextoDePolitica.
export default function PoliticaDePrivacidad() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Política de privacidad</h1>
      <p>Así cuida la junta los datos de cada vecino, según la Ley N.° 29733.</p>
      <TextoDePolitica />
    </div>
  );
}
