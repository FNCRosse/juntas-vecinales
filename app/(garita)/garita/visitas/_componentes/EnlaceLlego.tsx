import { Check } from "lucide-react";
import Link from "next/link";
import { clasesBoton } from "@/componentes/a11y/Boton";

/** "Llegó": abre la ficha de la visita anunciada (VIG-VIS-02), donde se anota la entrada. */
export function EnlaceLlego({ id, nombre }: { id: string; nombre: string }) {
  return (
    <Link href={`/garita/visitas/${id}`} className={`${clasesBoton("secundario")} self-start`}>
      <Check aria-hidden className="size-icono shrink-0" />
      <span>
        Llegó<span className="sr-only"> {nombre}</span>
      </span>
    </Link>
  );
}
