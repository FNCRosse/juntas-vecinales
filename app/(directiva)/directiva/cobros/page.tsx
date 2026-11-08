import {
  CalendarClock,
  CircleCheck,
  FileSearch,
  HandCoins,
  House,
  Info,
  Printer,
  Receipt,
  Scale,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { EncabezadoPagina } from "@/componentes/a11y/EncabezadoPagina";
import { Insignia } from "@/componentes/a11y/Insignia";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";
import { soles } from "@/compartido/dinero";
import { comprobantesPorRevisar } from "@/modulos/aportes/aplicacion/pagos";
import { cobrosEnCasaPorAtender } from "@/modulos/aportes/aplicacion/cobros";
import { reclamosPorAtender } from "@/modulos/aportes/aplicacion/decidirReclamos";
import { recibosEnPapelPorEntregar } from "@/modulos/aportes/aplicacion/recibos";
import { EntregarRecibo } from "./EntregarRecibo";
import { TarjetaDeCobro } from "./_componentes/TarjetaDeCobro";

export const metadata: Metadata = { title: "Cobros" };

const TIPOS = [
  { valor: "todos", etiqueta: "Todo lo que espera" },
  { valor: "comprobantes", etiqueta: "Comprobantes por revisar" },
  { valor: "en-casa", etiqueta: "Cobros en casa" },
  { valor: "reclamos", etiqueta: "Reclamos de cuota" },
  { valor: "papel", etiqueta: "Recibos en papel" },
];

const ENLACE = "inline-flex min-h-tactil items-center font-bold text-texto-enlace";

/** Quien ve su propio cobro no lo revisa: lo hace otro miembro (regla de dos personas). */
function EsSuyo({ children }: { children: string }) {
  return (
    <p className="inline-flex items-center gap-1 font-bold">
      <CircleCheck aria-hidden className="size-icono-pequeno" />
      {children}
    </p>
  );
}

// DIR-COB-01 (HU-COB-08 CA3): lo que mandaron los vecinos y espera a la directiva, con las tarjetas del prototipo
// (DCO01 a DCO04): comprobantes, cobros en casa, reclamos y recibos en papel. Aprobar, observar, cobrar y auditar
// se hacen en la pantalla de cada tarjeta.
export default async function Cobros({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const [{ items }, { items: enPapel }, { items: enCasa }, { items: reclamos }] = await Promise.all([
    comprobantesPorRevisar(sesion),
    recibosEnPapelPorEntregar(sesion),
    cobrosEnCasaPorAtender(sesion),
    reclamosPorAtender(sesion),
  ]);
  const { tipo: pedido } = await searchParams;
  const cuantos: Record<string, number> = {
    comprobantes: items.length,
    "en-casa": enCasa.length,
    reclamos: reclamos.length,
    papel: enPapel.length,
  };
  const tipo = pedido && pedido in cuantos ? pedido : "todos";
  const ver = (t: string) => tipo === "todos" || tipo === t;
  const opciones = TIPOS.map(({ valor, etiqueta }) => ({
    valor,
    etiqueta,
    detalle: valor === "todos" ? undefined : String(cuantos[valor]),
    href: valor === "todos" ? "/directiva/cobros" : `/directiva/cobros?tipo=${valor}`,
  }));
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Cobros"
        descripcion="Revise lo que mandaron los vecinos."
        accion={
          <BotonEnlace href="/directiva/cobros/poner-al-dia" icono={HandCoins} anchoCompleto>
            Poner al día a un vecino
          </BotonEnlace>
        }
      />
      <SelectorDeFiltro id="campo-tipo" pregunta="Mostrar" valor={tipo} opciones={opciones} />
      {tipo !== "todos" && cuantos[tipo] === 0 && tipo !== "comprobantes" && (
        <div role="status" className="flex flex-col items-center gap-2 px-4 pt-8 pb-4 text-center">
          <CircleCheck aria-hidden className="size-icono text-texto-secundario" />
          <strong>No hay nada de este tipo por atender</strong>
          <span className="text-texto-secundario">Elija otro tipo para ver el resto.</span>
        </div>
      )}
      {ver("comprobantes") &&
        (items.length > 0 ? (
          <>
            <p role="status" className="text-pequeno text-texto-secundario">
              {items.length === 1 ? "Hay 1 por atender." : `Hay ${items.length} por atender.`}
            </p>
            <div data-ancho="completo" className="flex flex-col gap-separacion">
              <ListaVerMas
                etiqueta="Comprobantes por revisar"
                elementos={items.map((i) => {
                  const parcial = i.etiqueta === "Pago parcial";
                  return (
                    <TarjetaDeCobro
                      key={i.id}
                      icono={Receipt}
                      tipo={`Comprobante digital · ${i.medio}`}
                      titulo={i.nombre}
                      casa={i.vivienda}
                      dato={{
                        icono: Wallet,
                        texto: `Debía ${soles(i.debia)}${parcial ? " · pago parcial" : ""}`,
                      }}
                      fecha={i.fecha}
                      monto={soles(i.monto)}
                      estado={
                        <Insignia tono={parcial ? "aviso" : "info"} icono={parcial ? TriangleAlert : Info}>
                          {i.etiqueta}
                        </Insignia>
                      }
                      accion={
                        !i.esSuyo && i.comprobanteId
                          ? {
                              href: `/directiva/cobros/comprobantes/${i.comprobanteId}`,
                              texto: "Revisar el comprobante",
                            }
                          : undefined
                      }
                    >
                      {i.esSuyo && <EsSuyo>Es su pago: lo revisa otro miembro</EsSuyo>}
                    </TarjetaDeCobro>
                  );
                })}
              />
            </div>
          </>
        ) : (
          <div role="status" className="flex flex-col items-center gap-2 px-4 pt-8 pb-4 text-center">
            <CircleCheck aria-hidden className="size-icono text-texto-secundario" />
            <strong>No hay comprobantes por revisar</strong>
            <span className="text-texto-secundario">Cuando un vecino mande un pago, lo verá aquí.</span>
          </div>
        ))}
      {ver("en-casa") && enCasa.length > 0 && (
        <section aria-labelledby="titulo-en-casa" data-ancho="completo" className="flex flex-col gap-4">
          <h2 id="titulo-en-casa" className="text-titulo-2">
            Cobros en casa por atender
          </h2>
          <ListaVerMas
            etiqueta="Cobros en casa por atender"
            elementos={enCasa.map((p) => (
              <TarjetaDeCobro
                key={p.id}
                nivel={3}
                icono={House}
                tipo={`Cobro en casa · pedido N.° ${p.numero}`}
                titulo={p.nombre}
                casa={p.vivienda}
                dato={{ icono: CalendarClock, texto: p.franja }}
                fecha={`Pedido el ${p.fecha}`}
                monto={soles(p.monto)}
                estado={
                  <Insignia tono="info" icono={Info}>
                    Pendiente de visita
                  </Insignia>
                }
                accion={
                  p.puedeCobrar
                    ? { href: `/directiva/cobros/en-casa/${p.id}`, texto: "Ir a cobrar" }
                    : undefined
                }
              >
                {p.esSuyo && <EsSuyo>Es su casa: lo cobra otro miembro</EsSuyo>}
              </TarjetaDeCobro>
            ))}
          />
        </section>
      )}
      {ver("reclamos") && reclamos.length > 0 && (
        <section aria-labelledby="titulo-reclamos" data-ancho="completo" className="flex flex-col gap-4">
          <h2 id="titulo-reclamos" className="text-titulo-2">
            Reclamos de cuota por atender
          </h2>
          <ListaVerMas
            etiqueta="Reclamos de cuota por atender"
            elementos={reclamos.map((r) => (
              <TarjetaDeCobro
                key={r.id}
                nivel={3}
                icono={Scale}
                tipo={`Reclamo de cuota · N.° ${r.numero}`}
                titulo={r.nombre}
                casa={r.vivienda}
                dato={{ icono: FileSearch, texto: r.motivo }}
                fecha={r.fecha}
                estado={
                  <Insignia tono="info" icono={Info}>
                    Por revisar
                  </Insignia>
                }
                accion={
                  r.puedeRevisar
                    ? { href: `/directiva/cobros/reclamos/${r.id}`, texto: "Revisar el reclamo" }
                    : undefined
                }
              >
                {r.esSuyo && <EsSuyo>Es su casa: lo revisa otro miembro</EsSuyo>}
              </TarjetaDeCobro>
            ))}
          />
        </section>
      )}
      {ver("papel") && enPapel.length > 0 && (
        <section aria-labelledby="titulo-papel" data-ancho="completo" className="flex flex-col gap-4">
          <h2 id="titulo-papel" className="text-titulo-2">
            Recibos en papel por entregar
          </h2>
          <ListaVerMas
            etiqueta="Recibos en papel por entregar"
            elementos={enPapel.map((p) => (
              <TarjetaDeCobro
                key={p.id}
                nivel={3}
                icono={Printer}
                tipo={`Recibo en papel · pedido N.° ${p.numero}`}
                titulo={p.nombre}
                casa={p.vivienda}
                dato={{ icono: Receipt, texto: p.recibo }}
                fecha={`Pedido el ${p.fecha}`}
                estado={
                  <Insignia tono="info" icono={Info}>
                    Por entregar en su casa
                  </Insignia>
                }
              >
                <p>Hora preferida: {p.franja}</p>
                {p.nota && <p>Nota: {p.nota}</p>}
                <EntregarRecibo pedidoId={p.id} reciboId={p.reciboId} puedeEntregar={p.puedeEntregar} />
              </TarjetaDeCobro>
            ))}
          />
        </section>
      )}
      <section aria-labelledby="titulo-otras" data-ancho="completo" className="flex flex-col gap-3">
        <h2 id="titulo-otras" className="text-titulo-2">
          Otras tareas de cobro
        </h2>
        <Link href="/directiva/cobros/guardados" className={ENLACE}>
          Cobros en efectivo guardados
        </Link>
        <Link href="/directiva/cobros/tarifa" className={ENLACE}>
          Tarifa de la cuota semanal
        </Link>
      </section>
    </div>
  );
}
