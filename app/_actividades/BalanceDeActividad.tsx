import { FileText, Receipt } from "lucide-react";
import type { ReactNode } from "react";
import { Cifra } from "@/componentes/a11y/Cifra";
import { GraficoBalance } from "@/componentes/a11y/GraficoBalance";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { soles } from "@/compartido/dinero";

// Las cuentas de una actividad pro-fondos (prototipo DAS09): ingresos, costos y utilidad en cifras, el gráfico con su tabla
// y los gastos. La directiva ve el comprobante de cada gasto; el vecino, solo concepto y monto.

export type Cuentas = {
  ingresosVirtuales: number;
  ingresosEnPuerta: number;
  gastos: { concepto: string; monto: number; comprobanteId: string | null }[];
};

export function BalanceDeActividad({ cuentas, accion }: { cuentas: Cuentas; accion?: ReactNode }) {
  const ingresos = cuentas.ingresosVirtuales + cuentas.ingresosEnPuerta;
  const costos = cuentas.gastos.reduce((s, g) => s + g.monto, 0);
  const totales = { ingresos, egresos: costos, utilidadNeta: ingresos - costos };
  const n = cuentas.gastos.length;
  return (
    <>
      <ul data-ancho="completo" className="grid gap-separacion md:grid-cols-3">
        <li className="flex">
          <Cifra
            titulo="Ingresos"
            valor={soles(ingresos)}
            detalle={`${soles(cuentas.ingresosVirtuales)} por Yape o Plin y ${soles(cuentas.ingresosEnPuerta)} en la puerta`}
          />
        </li>
        <li className="flex">
          <Cifra
            titulo="Costos"
            valor={soles(costos)}
            detalle={
              n === 0
                ? "Sin gastos anotados"
                : n === 1
                  ? "1 comprobante adjunto"
                  : `${n} comprobantes adjuntos`
            }
          />
        </li>
        <li className="flex">
          <Cifra
            titulo={totales.utilidadNeta < 0 ? "Pérdida" : "Utilidad"}
            valor={soles(totales.utilidadNeta)}
          />
        </li>
      </ul>
      <section className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6">
        <GraficoBalance totales={totales} titulo="Balance de la actividad" />
      </section>
      <section aria-labelledby="titulo-gastos" className="flex flex-col gap-3">
        <h2 id="titulo-gastos" className="flex items-center gap-2 text-titulo-3">
          <Receipt aria-hidden className="size-icono shrink-0 text-accion-primaria" />
          Gastos con comprobante
        </h2>
        {n ? (
          <ListaVerMas
            etiqueta="Gastos con comprobante"
            elementos={cuentas.gastos.map((g, i) => (
              <div
                key={i}
                className="flex flex-wrap items-start justify-between gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <span className="flex min-w-0 flex-col gap-2">
                  <strong>{g.concepto}</strong>
                  {g.comprobanteId && (
                    <a
                      href={`/api/archivos/${g.comprobanteId}`}
                      className="inline-flex min-h-tactil items-center gap-2 font-bold text-texto-enlace"
                    >
                      <FileText aria-hidden className="size-icono shrink-0" />
                      Ver el comprobante
                      <span className="sr-only"> de {g.concepto}</span>
                    </a>
                  )}
                </span>
                <strong>{soles(g.monto)}</strong>
              </div>
            ))}
          />
        ) : (
          <p className="text-texto-secundario">Todavía no hay gastos anotados.</p>
        )}
        {accion}
      </section>
    </>
  );
}
