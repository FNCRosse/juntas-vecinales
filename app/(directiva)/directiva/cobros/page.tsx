import { Banknote, CircleCheck, FileSearch, Info, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { soles } from "@/compartido/dinero";
import { comprobantesPorRevisar } from "@/modulos/aportes/aplicacion/pagos";
import { cobrosEnCasaPorAtender } from "@/modulos/aportes/aplicacion/cobros";
import { recibosEnPapelPorEntregar } from "@/modulos/aportes/aplicacion/recibos";
import { EntregarRecibo } from "./EntregarRecibo";

export const metadata: Metadata = { title: "Cobros" };

// DIR-COB-01 (HU-COB-08 CA3): los comprobantes que mandaron los vecinos y esperan a la directiva, el más reciente
// primero. Aprobarlos es de HU-COB-09; observarlos llega con HU-COB-10; los cobros en casa y los reclamos, con HU-COB-11 y 03.
export default async function Cobros() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const [{ items }, { items: enPapel }, { items: enCasa }] = await Promise.all([
    comprobantesPorRevisar(sesion),
    recibosEnPapelPorEntregar(sesion),
    cobrosEnCasaPorAtender(sesion),
  ]);
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
                {!i.esSuyo && i.comprobanteId && (
                  <BotonEnlace
                    href={`/directiva/cobros/comprobantes/${i.comprobanteId}`}
                    variante="secundario"
                    icono={FileSearch}
                  >
                    Revisar el comprobante
                  </BotonEnlace>
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
      {enCasa.length > 0 && (
        <section aria-labelledby="titulo-en-casa" className="flex flex-col gap-4">
          <h2 id="titulo-en-casa" className="text-titulo-2">
            Cobros en casa por atender
          </h2>
          <ListaVerMas
            etiqueta="Cobros en casa por atender"
            elementos={enCasa.map((p) => (
              <article
                key={p.id}
                className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <p className="text-pequeno font-bold text-texto-secundario">
                  Cobro en casa · pedido N.° {p.numero}
                </p>
                <h3 className="text-titulo-3">{p.nombre}</h3>
                <p>{p.vivienda}</p>
                <p>{p.franja}</p>
                <p className="text-pequeno text-texto-secundario">Pedido el {p.fecha}</p>
                <p className="text-titulo-3">{soles(p.monto)}</p>
                <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
                  <Info aria-hidden className="size-icono-pequeno" />
                  Pendiente de visita
                </span>
                {p.esSuyo && (
                  <p className="inline-flex items-center gap-1 font-bold">
                    <CircleCheck aria-hidden className="size-icono-pequeno" />
                    Es su casa: lo cobra otro miembro
                  </p>
                )}
                {p.puedeCobrar && (
                  <BotonEnlace href={`/directiva/cobros/en-casa/${p.id}`} icono={Banknote}>
                    Ir a cobrar
                  </BotonEnlace>
                )}
              </article>
            ))}
          />
        </section>
      )}
      {enPapel.length > 0 && (
        <section aria-labelledby="titulo-papel" className="flex flex-col gap-4">
          <h2 id="titulo-papel" className="text-titulo-2">
            Recibos en papel por entregar
          </h2>
          <ListaVerMas
            etiqueta="Recibos en papel por entregar"
            elementos={enPapel.map((p) => (
              <article
                key={p.id}
                className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <p className="text-pequeno font-bold text-texto-secundario">
                  Recibo en papel · pedido N.° {p.numero}
                </p>
                <h3 className="text-titulo-3">{p.nombre}</h3>
                <p>{p.vivienda}</p>
                <p>{p.recibo}</p>
                <p className="text-pequeno text-texto-secundario">Pedido el {p.fecha}</p>
                <p>Hora preferida: {p.franja}</p>
                {p.nota && <p>Nota: {p.nota}</p>}
                <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
                  <Info aria-hidden className="size-icono-pequeno" />
                  Por entregar en su casa
                </span>
                <EntregarRecibo pedidoId={p.id} reciboId={p.reciboId} puedeEntregar={p.puedeEntregar} />
              </article>
            ))}
          />
        </section>
      )}
      <section aria-labelledby="titulo-otras" className="flex flex-col gap-3">
        <h2 id="titulo-otras" className="text-titulo-2">
          Otras tareas de cobro
        </h2>
        <Link
          href="/directiva/cobros/guardados"
          className="inline-flex min-h-tactil items-center font-bold text-texto-enlace"
        >
          Cobros en efectivo guardados
        </Link>
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
