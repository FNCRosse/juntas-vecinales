import { Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { verNoticias } from "@/modulos/transparencia/aplicacion/comunicados";
import { TarjetaNoticia } from "./TarjetaNoticia";

export const metadata: Metadata = { title: "Noticias de la junta" };

// VEC-TRA-04 Noticias de la junta (HU-ASA-15 CA2 y CA3): los comunicados generales, los urgentes
// primero y luego los más nuevos. Sin filtros ni jerarquías: una lista lineal.
export default async function Noticias() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const noticias = await verNoticias(sesion);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Noticias de la junta</h1>
        <p className="text-texto-secundario">Los urgentes aparecen primero.</p>
      </div>
      {noticias.length ? (
        <ul className="flex flex-col gap-separacion" aria-label="Noticias">
          {noticias.map((n) => (
            <li key={n.id}>
              <TarjetaNoticia noticia={n} />
            </li>
          ))}
        </ul>
      ) : (
        <div role="status" className="flex flex-col items-center gap-2 p-6 text-center">
          <Newspaper aria-hidden className="size-icono text-texto-secundario" />
          <strong>Todavía no hay noticias</strong>
          <span>Cuando la junta publique una, la verá aquí.</span>
        </div>
      )}
    </div>
  );
}
