import { ChevronLeft, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { Cifra } from "@/componentes/a11y/Cifra";
import { GraficoRecaudacion } from "@/componentes/a11y/GraficoRecaudacion";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";
import { soles } from "@/compartido/dinero";
import { consultarTablero, opcionesDelTablero } from "@/modulos/aportes/aplicacion/tablero";
import { rendicionDeCuentas } from "@/modulos/transparencia/aplicacion/caja";
import { Cuadre } from "./Cuadre";

export const metadata: Metadata = { title: "Recaudación" };

const RUTA = "/directiva/cobros/recaudacion";

// DIR-COB-18 (HU-COB-13): lo cobrado en un periodo, sumando los recibos digitales y en efectivo, con los filtros por periodo y
// por estado de las casas, la comprobación de que cuadra y la tabla equivalente del gráfico. Solo se mira: la directiva y el
// mediador lo ven igual; exportar es solo de la directiva (HU-COB-15). Con un mes elegido, suma lo gastado y el saldo de caja.
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
  const caja = await rendicionDeCuentas(sesion, periodo.valor);
  const cuentas = caja.mes === periodo.valor ? caja : null;
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
      <ul className="grid grid-cols-2 gap-separacion lg:grid-cols-4">
        {(
          [
            ["Se cobró", soles(t.seCobro), undefined],
            [
              "Recibos emitidos",
              String(t.recibos),
              `${t.digital.cantidad} digitales y ${t.efectivo.cantidad} en efectivo`,
            ],
            // Lo gastado y el saldo son de un mes entero: con otro periodo no se muestran como si lo fueran.
            ["Se gastó", cuentas ? soles(cuentas.gastos) : "—", cuentas ? undefined : "Solo por mes"],
            ["Saldo de caja", cuentas ? soles(cuentas.saldo) : "—", cuentas ? undefined : "Solo por mes"],
          ] as [string, string, string | undefined][]
        ).map(([titulo, valor, detalle]) => (
          <li key={titulo} className="flex">
            <Cifra titulo={titulo} valor={valor} detalle={detalle} />
          </li>
        ))}
      </ul>
      <p className="text-texto-secundario">
        Falta cobrar: <strong>{soles(t.faltaCobrar.monto)}</strong> ({t.faltaCobrar.cuotas}{" "}
        {t.faltaCobrar.cuotas === 1 ? "cuota semanal" : "cuotas semanales"}).
      </p>
      <Cuadre t={t} />
      <div data-ancho="completo" className="flex flex-col gap-6">
        <GraficoRecaudacion semanas={t.semanas} digital={t.digital.monto} efectivo={t.efectivo.monto} />
        {sesion.roles.includes("DIRECTIVA") && (
          <BotonEnlace
            href={`${RUTA}/exportar?periodo=${periodo.valor}&estado=${estado.valor}`}
            variante="secundario"
            icono={Download}
          >
            Exportar a Excel o CSV
          </BotonEnlace>
        )}
      </div>
    </div>
  );
}
