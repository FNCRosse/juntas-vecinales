import { ChevronLeft, Search, TriangleAlert, CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { soles } from "@/compartido/dinero";
import { buscarCasasPorPonerAlDia } from "@/modulos/aportes/aplicacion/liquidaciones";

export const metadata: Metadata = { title: "Poner al día a un vecino" };

// DIR-COB-15 (HU-COB-07 CA1 y CA3): busca por nombre o DNI y muestra lo que debe la casa, desde cuándo y si la reja se le
// abre sola. El formulario es de método GET: la búsqueda queda en la dirección y se puede volver a ella.
export default async function PonerAlDia({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const { q = "" } = await searchParams;
  const buscado = q.trim().length >= 2;
  const { casas } = buscado ? await buscarCasasPorPonerAlDia(sesion, q) : { casas: [] };
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/cobros"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a cobros
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Poner al día a un vecino</h1>
        {/* DIR-19: dos caminos distintos, el pago de toda la deuda o cobrar algunas semanas en efectivo. */}
        <ul className="flex list-disc flex-col gap-1 pl-6">
          <li>
            <strong>Registrar el pago total</strong>: paga toda la deuda de la casa, queda al día y el
            vigilante vuelve a abrirle la reja.
          </li>
          <li>
            <strong>Cobrar en efectivo</strong>: le cobra las semanas que pueda pagar, aunque no haya pedido
            el cobro en casa.
          </li>
        </ul>
      </div>
      <form method="get" role="search" className="flex flex-col gap-4">
        <Campo
          name="q"
          etiqueta="Buscar por nombre o DNI"
          ayuda="Ejemplo: Julio Mendoza o 40123341"
          defaultValue={q}
          autoComplete="off"
        />
        <Boton type="submit" icono={Search} anchoCompleto>
          Buscar
        </Boton>
      </form>
      {buscado && casas.length === 0 && (
        <p role="status">No encontramos a nadie con «{q.trim()}». Revise el nombre o el DNI.</p>
      )}
      {casas.length > 0 && (
        <ListaVerMas
          etiqueta="Casas encontradas"
          elementos={casas.map((c) => (
            <article
              key={c.predioId}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <h2 className="text-titulo-3">{c.nombre}</h2>
              <p>
                {c.vivienda} · DNI terminado en {c.dniTerminadoEn}
              </p>
              {c.debe > 0 ? (
                <>
                  <p className="text-titulo-3">Debe {soles(c.debe)}</p>
                  <p>{c.detalle}</p>
                  <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-aviso bg-fondo-aviso px-3 text-pequeno font-bold text-texto-aviso">
                    <TriangleAlert aria-hidden className="size-icono-pequeno" />
                    {c.semanas} {c.semanas === 1 ? "semana pendiente" : "semanas pendientes"}
                  </span>
                  {c.rejaSuspendida && (
                    <div className="flex flex-col gap-1 rounded-control border border-borde-aviso bg-fondo-aviso p-3">
                      <strong>El vigilante no le abre la reja a esta casa</strong>
                      <span>
                        Pasó las 8 semanas sin pago. Se restablece apenas se registre el pago total.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-titulo-3">No debe nada</p>
                  <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-exito bg-fondo-exito px-3 text-pequeno font-bold text-texto-exito">
                    <CircleCheck aria-hidden className="size-icono-pequeno" />
                    Al día
                  </span>
                </>
              )}
              {c.cuotaSemanal && (
                <p className="text-pequeno text-texto-secundario">Cuota semanal {c.cuotaSemanal}</p>
              )}
              {c.esSuya && (
                <p className="font-bold">Es su casa: la pone al día otro miembro de la directiva.</p>
              )}
              {c.puedeRegistrar && (
                <div className="flex flex-col gap-opuestas">
                  <BotonEnlace href={`/directiva/cobros/poner-al-dia/${c.predioId}`}>
                    Registrar el pago total
                  </BotonEnlace>
                  <BotonEnlace
                    href={`/directiva/cobros/poner-al-dia/${c.predioId}/cobrar`}
                    variante="secundario"
                  >
                    Cobrar en efectivo
                  </BotonEnlace>
                </div>
              )}
            </article>
          ))}
        />
      )}
    </div>
  );
}
