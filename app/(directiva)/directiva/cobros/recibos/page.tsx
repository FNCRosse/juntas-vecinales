import { ChevronLeft, Receipt, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { FilaEnlace } from "@/componentes/a11y/Tarjeta";
import { soles } from "@/compartido/dinero";
import { recibosDeLaDirectiva } from "@/modulos/aportes/aplicacion/recibos";

export const metadata: Metadata = { title: "Todos los recibos" };

// DIR-13 (HU-COB-12): todos los recibos emitidos, para volver a verlos e imprimirlos. Cada fila abre el recibo oficial, que
// tiene el PDF para imprimir. Los ven la directiva y los mediadores.
export default async function TodosLosRecibos({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [sesion, { q = "" }] = await Promise.all([
    exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo"),
    searchParams,
  ]);
  const { recibos, hayMas } = await recibosDeLaDirectiva(sesion, q);
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/cobros"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Cobros
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Todos los recibos</h1>
        <p>Abra un recibo para verlo o imprimirlo cuando lo necesite.</p>
      </div>
      <form action="/directiva/cobros/recibos" method="get" role="search" className="flex flex-col gap-4">
        <Campo
          name="q"
          type="search"
          etiqueta="Buscar un recibo"
          ayuda="Escriba el número del recibo, el nombre del vecino o su lote."
          defaultValue={q}
          autoComplete="off"
        />
        <Boton type="submit" icono={Search} variante="secundario" anchoCompleto>
          Buscar
        </Boton>
      </form>
      {recibos.length === 0 ? (
        <p>
          {q.trim() ? "No encontramos recibos con eso. Revise lo que escribió." : "Todavía no hay recibos."}
        </p>
      ) : (
        <>
          <ListaVerMas
            etiqueta="Recibos"
            normal={3}
            senior={2}
            elementos={recibos.map((r) => (
              <FilaEnlace
                key={r.id}
                href={`/directiva/cobros/recibos/${r.id}`}
                icono={Receipt}
                titulo={`Recibo N.° ${r.numero} · ${soles(r.monto)}`}
                detalle={`${r.titular} · ${r.vivienda} · ${r.fecha}`}
              />
            ))}
          />
          {hayMas && (
            <p className="text-texto-secundario">
              Se muestran los más recientes. Use el buscador para ver otros.
            </p>
          )}
        </>
      )}
    </div>
  );
}
