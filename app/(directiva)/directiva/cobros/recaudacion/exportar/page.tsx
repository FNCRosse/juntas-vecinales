import { ChevronLeft, Download, History } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";
import { soles } from "@/compartido/dinero";
import { consultarTablero, opcionesDelTablero } from "@/modulos/aportes/aplicacion/tablero";

export const metadata: Metadata = { title: "Exportar la recaudación" };

const RUTA = "/directiva/cobros/recaudacion/exportar";

// DIR-COB-19 (HU-COB-15): el periodo y el estado de las casas que se exportan, qué trae el archivo y la descarga. Solo la
// directiva (el archivo trae lo que paga cada casa). El formato es CSV, que abren Excel y Google Sheets.
export default async function ExportarRecaudacion({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; estado?: string }>;
}) {
  const sesion = await exigirActor(["DIRECTIVA"], "/entrar/equipo");
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
        href={`/directiva/cobros/recaudacion?periodo=${periodo.valor}&estado=${estado.valor}`}
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a la recaudación
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Exportar la recaudación</h1>
        <p>Para guardar un respaldo o revisarlo en una hoja de cálculo.</p>
      </div>
      <section aria-labelledby="titulo-formato" className="flex flex-col gap-1">
        <h2 id="titulo-formato" className="text-titulo-3">
          Formato del archivo
        </h2>
        <p className="font-bold">CSV (.csv)</p>
        <p className="text-texto-secundario">
          Texto separado por comas. Se abre en Excel y en Google Sheets.
        </p>
      </section>
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
      <section
        aria-labelledby="titulo-contenido"
        className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
      >
        <h2 id="titulo-contenido" className="text-titulo-3">
          El archivo tendrá
        </h2>
        <dl className="flex flex-col gap-3">
          {[
            ["Total cobrado", soles(t.seCobro)],
            [
              "Recibos",
              `${t.recibos} (${t.digital.cantidad} digitales y ${t.efectivo.cantidad} en efectivo)`,
            ],
            ["Desglose", "Por semana, por casa y por estado"],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex flex-col">
              <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
              <dd className="font-bold">{valor}</dd>
            </div>
          ))}
        </dl>
        <p>Son los mismos totales del resumen de la directiva.</p>
      </section>
      <p>La descarga queda en el historial de acciones con su nombre, la fecha y la hora.</p>
      <div className="flex flex-col gap-opuestas">
        <BotonEnlace
          href={`/api/transparencia/exportar?desde=${t.periodo.desde}&hasta=${t.periodo.hasta}&estado=${estado.valor}`}
          icono={Download}
        >
          Descargar el archivo
        </BotonEnlace>
        <BotonEnlace href="/directiva/historial" variante="secundario" icono={History}>
          Ver el historial de acciones
        </BotonEnlace>
      </div>
    </div>
  );
}
