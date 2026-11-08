import type { LucideIcon } from "lucide-react";
import { FilaEnlace } from "@/componentes/a11y/Tarjeta";
import { Volver } from "@/componentes/a11y/Volver";

export type Destino = { href: string; titulo: string; icono: LucideIcon; detalle?: string };

/** Una categoría de "Más opciones" (prototipo DMA03 a DMA05): volver, el título y una fila por destino. */
export function Categoria({ titulo, destinos }: { titulo: string; destinos: Destino[] }) {
  return (
    <div className="flex flex-col gap-6">
      <Volver href="/directiva/mas">Volver a Más opciones</Volver>
      <h1 className="text-titulo-1">{titulo}</h1>
      <div className="flex flex-col gap-separacion">
        {destinos.map((d) => (
          <FilaEnlace key={d.href} href={d.href} icono={d.icono} titulo={d.titulo} detalle={d.detalle} />
        ))}
      </div>
    </div>
  );
}
