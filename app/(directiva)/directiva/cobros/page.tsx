import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { soles } from "@/compartido/dinero";
import { comprobantesPorRevisar } from "@/modulos/aportes/aplicacion/pagos";

export const metadata: Metadata = { title: "Cobros" };

// DIR-COB-01 (HU-COB-08 CA3): los comprobantes que mandaron los vecinos y esperan a la directiva, el más reciente
// primero. Revisarlos (aprobar u observar) llega con HU-COB-09 y 10; los cobros en casa y los reclamos, con HU-COB-11 y 03.
export default async function Cobros() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const { items } = await comprobantesPorRevisar(sesion);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Cobros</h1>
        <p>Revise lo que mandaron los vecinos.</p>
      </div>
      {items.length > 0 ? (
        <>
          <p role="status">
            {items.length === 1 ? "Hay 1 por atender." : `Hay ${items.length} por atender.`}
          </p>
          <ListaVerMas
            etiqueta="Comprobantes por revisar"
            elementos={items.map((i) => (
              <article
                key={i.id}
                className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <p className="text-pequeno font-bold text-texto-secundario">
                  Comprobante digital · {i.medio}
                </p>
                <h2 className="text-titulo-3">{i.nombre}</h2>
                <p>{i.vivienda}</p>
                <p>
                  Debía {soles(i.debia)}
                  {i.etiqueta === "Pago parcial" ? " · pago parcial" : ""}
                </p>
                <p className="text-pequeno text-texto-secundario">{i.fecha}</p>
                <p className="text-titulo-3">{soles(i.monto)}</p>
                <span
                  className={`inline-flex items-center gap-1 self-start rounded-pastilla border px-3 text-pequeno font-bold ${i.etiqueta === "Pago parcial" ? "border-borde-aviso bg-fondo-aviso text-texto-aviso" : "border-borde-info bg-fondo-info text-texto-info"}`}
                >
                  {i.etiqueta === "Pago parcial" ? (
                    <TriangleAlert aria-hidden className="size-icono-pequeno" />
                  ) : (
                    <Info aria-hidden className="size-icono-pequeno" />
                  )}
                  {i.etiqueta}
                </span>
                {i.esSuyo && (
                  <p className="inline-flex items-center gap-1 font-bold">
                    <CircleCheck aria-hidden className="size-icono-pequeno" />
                    Es su pago: lo revisa otro miembro
                  </p>
                )}
              </article>
            ))}
          />
        </>
      ) : (
        <div role="status" className="flex flex-col items-center gap-2 p-6 text-center">
          <CircleCheck aria-hidden className="size-icono text-texto-secundario" />
          <strong>No hay comprobantes por revisar</strong>
          <span>Cuando un vecino mande un pago, lo verá aquí.</span>
        </div>
      )}
      <section aria-labelledby="titulo-otras" className="flex flex-col gap-3">
        <h2 id="titulo-otras" className="text-titulo-2">
          Otras tareas de cobro
        </h2>
        <Link
          href="/directiva/cobros/tarifa"
          className="inline-flex min-h-tactil items-center font-bold text-texto-enlace"
        >
          Tarifa de la cuota semanal
        </Link>
      </section>
    </div>
  );
}
