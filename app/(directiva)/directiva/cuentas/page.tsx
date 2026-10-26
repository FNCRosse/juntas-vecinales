import { Download, ListChecks, Plus, Send } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { GraficoGastos } from "@/componentes/a11y/GraficoGastos";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";
import { soles } from "@/compartido/dinero";
import { rendicionDeCuentas } from "@/modulos/transparencia/aplicacion/caja";

export const metadata: Metadata = { title: "Rendición de cuentas" };

const RUTA = "/directiva/cuentas";

// DIR-TRA-01 (HU-COB-14): lo que entró y lo que se gastó en el mes, en qué se gastó y el saldo. Las cuotas son los recibos emitidos;
// lo demás lo registra la directiva con su comprobante. La directiva registra y publica; el mediador la ve. Los comprobantes
// están en la lista de movimientos (DIR-TRA-05).
export default async function Rendicion({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const r = await rendicionDeCuentas(sesion, (await searchParams).mes);
  const esDirectiva = sesion.roles.includes("DIRECTIVA");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Rendición de cuentas de {r.etiqueta.toLowerCase()}</h1>
        <p>Lo que entró a la caja de vigilancia, en qué se gastó y lo que queda.</p>
      </div>
      <SelectorDeFiltro
        id="campo-mes"
        pregunta="Mes"
        valor={r.mes}
        opciones={r.meses.map((m) => ({ ...m, href: `${RUTA}?mes=${m.valor}` }))}
      />
      {r.publicada && (
        <MensajeEstado tipo="exito" titulo="Esta rendición ya se publicó">
          <p>
            La publicó {r.publicada.por} el {r.publicada.cuando}. Los vecinos la ven en Cuentas del barrio.
          </p>
        </MensajeEstado>
      )}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Ingresos", soles(r.ingresos), "Cuotas y otros ingresos de la caja"],
          [
            "Gastos",
            soles(r.gastos),
            r.comprobantes === 1 ? "1 comprobante adjunto" : `${r.comprobantes} comprobantes adjuntos`,
          ],
          ["Saldo del mes", soles(r.saldo), null],
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
      {r.gastosPorConcepto.length > 0 ? (
        <GraficoGastos gastos={r.gastosPorConcepto} />
      ) : (
        <p>Todavía no se registró ningún gasto este mes.</p>
      )}
      <div className="flex flex-col gap-opuestas">
        {esDirectiva && !r.publicada && (
          <BotonEnlace href={`${RUTA}/publicar?mes=${r.mes}`} icono={Send}>
            Revisar y publicar
          </BotonEnlace>
        )}
        {esDirectiva && (
          <BotonEnlace href={`${RUTA}/registrar`} variante="secundario" icono={Plus}>
            Registrar un ingreso o gasto
          </BotonEnlace>
        )}
        {esDirectiva && (
          <BotonEnlace href="/directiva/cobros/recaudacion/exportar" variante="secundario" icono={Download}>
            Exportar a Excel o CSV
          </BotonEnlace>
        )}
        <BotonEnlace href={`${RUTA}/movimientos?mes=${r.mes}`} variante="secundario" icono={ListChecks}>
          Ver todos los ingresos y gastos
        </BotonEnlace>
      </div>
    </div>
  );
}
