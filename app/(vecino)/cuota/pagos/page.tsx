import { ChevronLeft, CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { soles } from "@/compartido/dinero";
import { miCuota } from "@/modulos/aportes/aplicacion/deuda";

export const metadata: Metadata = { title: "Mis pagos y recibos" };

// VEC-COB-05 (HU-COB-02 CA1): lo que la casa ya pagó, de la semana más reciente a la más antigua. Solo ve su casa. Los
// pagos con su medio y su estado, y los recibos, se suman con HU-COB-08, 09 y 12.
export default async function MisPagos() {
  const sesion = await exigirActor(
    ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    "/entrar",
  );
  const cuota = await miCuota(sesion);
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/cuota"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Mi cuota
      </Link>
      <h1 className="text-titulo-1">Mis pagos y recibos</h1>
      {cuota && cuota.historial.length > 0 ? (
        <ListaVerMas
          etiqueta="Semanas pagadas"
          elementos={cuota.historial.map((h) => (
            <article
              key={h.id}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <h2 className="text-titulo-3">{h.semana}</h2>
              <p className="font-bold">{soles(h.monto)}</p>
              <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-exito bg-fondo-exito px-3 text-pequeno font-bold text-texto-exito">
                <CircleCheck aria-hidden className="size-icono-pequeno" />
                Pagada
              </span>
            </article>
          ))}
        />
      ) : (
        <p>Todavía no tiene pagos registrados.</p>
      )}
      <p className="text-texto-secundario">Solo usted y la directiva ven esta información.</p>
    </div>
  );
}
