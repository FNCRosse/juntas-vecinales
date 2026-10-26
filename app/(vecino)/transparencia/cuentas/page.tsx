import { ChevronLeft, Download, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { GraficoGastos } from "@/componentes/a11y/GraficoGastos";
import { GraficoSemanas } from "@/componentes/a11y/GraficoSemanas";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";
import { soles } from "@/compartido/dinero";
import { cuentasDelBarrio } from "@/modulos/transparencia/aplicacion/cuentasDelBarrio";

export const metadata: Metadata = { title: "Cuentas del barrio" };

const RUTA = "/transparencia/cuentas";

// VEC-TRA-01 (HU-COB-14): cuánto se juntó para la vigilancia, cuánto falta cobrar y, cuando la directiva publicó la rendición del
// mes, en qué se gastó. Son totales del barrio: no trae nada de una casa ni de una persona (CA2). Se calcula en cada carga, así
// que cambia con cada pago que valida la directiva (CA3).
export default async function CuentasDelBarrio({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const c = await cuentasDelBarrio(sesion, (await searchParams).mes);
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/transparencia"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Actas y balances
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Cuentas del barrio</h1>
        <p className="text-texto-secundario">
          Cuánto se juntó para la vigilancia y en qué se usó. Son totales del barrio: no se ve lo que paga
          ninguna casa.
        </p>
      </div>
      <SelectorDeFiltro
        id="campo-mes"
        pregunta="Mes"
        valor={c.mes}
        opciones={c.meses.map((m) => ({ ...m, href: `${RUTA}?mes=${m.valor}` }))}
      />
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Se juntó", soles(c.seJunto), null],
          ["Se gastó", c.gastos ? soles(c.gastos.total) : "Sin publicar", null],
          [
            "Falta cobrar",
            soles(c.faltaCobrar.monto),
            `${c.faltaCobrar.cuotas} ${c.faltaCobrar.cuotas === 1 ? "cuota semanal" : "cuotas semanales"}`,
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
      <GraficoSemanas semanas={c.semanas} />
      {c.gastos ? (
        <GraficoGastos gastos={c.gastos.detalle} />
      ) : (
        <section aria-labelledby="titulo-gastos" className="flex flex-col gap-2">
          <h2 id="titulo-gastos" className="text-titulo-3">
            En qué se gastó
          </h2>
          <p className="inline-flex items-center gap-2">
            <Info aria-hidden className="size-icono-pequeno shrink-0" />
            La directiva todavía no publicó los gastos de este mes.
          </p>
        </section>
      )}
      <p className="text-pequeno text-texto-secundario">
        Se actualiza cada vez que la directiva valida un pago.
        {c.actualizado ? ` Última vez: ${c.actualizado}.` : ""}
      </p>
      <BotonEnlace
        href={`/api/transparencia/balance-agregado/pdf?periodo=${c.mes}`}
        variante="secundario"
        icono={Download}
      >
        Descargar las cuentas (PDF)
      </BotonEnlace>
    </div>
  );
}
