import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { GraficoRecaudacion } from "@/componentes/a11y/GraficoRecaudacion";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";
import { soles } from "@/compartido/dinero";
import { consultarTablero, opcionesDelTablero } from "@/modulos/aportes/aplicacion/tablero";
import { Cuadre } from "./Cuadre";

export const metadata: Metadata = { title: "Recaudación" };

const RUTA = "/directiva/cobros/recaudacion";

// DIR-COB-18 (HU-COB-13): lo cobrado en un periodo, sumando los recibos digitales y en efectivo, con los filtros por periodo y
// por estado de las casas, la comprobación de que cuadra y la tabla equivalente del gráfico. Solo se mira: la directiva y el
// mediador lo ven igual. Falta el gasto y el saldo de caja del prototipo (no hay dónde registrar los gastos de la caja) y la
// exportación (HU-COB-15).
export default async function Recaudacion({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; estado?: string }>;
}) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const pedido = await searchParams;
  const { periodos, periodo, estados } = opcionesDelTablero(pedido.periodo);
  const estado = estados.find((e) => e.valor === pedido.estado) ?? estados[0];
  const t = await consultarTablero(sesion, {
    desde: periodo.desde,
    hasta: periodo.hasta,
    estado: estado.valor,
  });
  const enlace = (p: string, e: string) => `${RUTA}?periodo=${p}&estado=${e}`;
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al resumen
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Recaudación</h1>
        <p>Suma los recibos digitales y en efectivo del periodo elegido.</p>
      </div>
      <SelectorDeFiltro
        id="campo-periodo"
        pregunta="Periodo"
        valor={periodo.valor}
        opciones={periodos.map((p) => ({
          valor: p.valor,
          etiqueta: p.etiqueta,
          href: enlace(p.valor, estado.valor),
        }))}
      />
      <SelectorDeFiltro
        id="campo-estado"
        pregunta="Estado de las casas"
        valor={estado.valor}
        opciones={estados.map((e) => ({
          valor: e.valor,
          etiqueta: e.etiqueta,
          href: enlace(periodo.valor, e.valor),
        }))}
      />
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          ["Se cobró", soles(t.seCobro), null],
          [
            "Recibos emitidos",
            String(t.recibos),
            `${t.digital.cantidad} digitales y ${t.efectivo.cantidad} en efectivo`,
          ],
          [
            "Falta cobrar",
            soles(t.faltaCobrar.monto),
            `${t.faltaCobrar.cuotas} ${t.faltaCobrar.cuotas === 1 ? "cuota semanal" : "cuotas semanales"}`,
          ],
        ].map(([titulo, valor, detalle]) => (
          <div
            key={titulo}
            className="flex flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
          >
            <dt className="text-pequeno text-texto-secundario">{titulo}</dt>
            <dd className="text-titulo-2 font-bold">{valor}</dd>
            {detalle && <dd className="text-pequeno text-texto-secundario">{detalle}</dd>}
          </div>
        ))}
      </dl>
      <Cuadre t={t} />
      <GraficoRecaudacion semanas={t.semanas} digital={t.digital.monto} efectivo={t.efectivo.monto} />
    </div>
  );
}
