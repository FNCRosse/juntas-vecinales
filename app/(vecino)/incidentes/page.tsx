import { ChevronRight, Megaphone } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { OfertaDeGuia } from "@/app/_guias/OfertaDeGuia";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { EncabezadoPagina } from "@/componentes/a11y/EncabezadoPagina";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { fechaCorta } from "@/compartido/fechas";
import { InsigniaDeEstado } from "@/app/_incidentes/InsigniaDeEstado";
import { guiaDeSeccion } from "@/modulos/accesibilidad/aplicacion/guias";
import {
  mapaDeIncidentes,
  PERIODOS_DEL_MAPA,
  type PeriodoDelMapa,
} from "@/modulos/incidencias/aplicacion/mapa";
import { misQuejas } from "@/modulos/incidencias/aplicacion/quejas";
import { BuscarPorCodigo } from "./_componentes/BuscarPorCodigo";
import { IncidentesDelBarrio, VISTAS, type Vista } from "./_componentes/IncidentesDelBarrio";

export const metadata: Metadata = { title: "Incidentes del barrio" };

// VEC-QUE-01 a VEC-QUE-03 (HU-QUE-01, HU-QUE-04, HU-QUE-08): en una sola columna y en este orden: buscar con un código de
// seguimiento, la oferta de la guía (a todo el ancho), Mis reportes (tarjetas angostas, extendidas) y En el barrio, que por
// defecto muestra el último mes y se puede filtrar por periodo y por vista (lista, mapa o resumen).
export default async function Incidentes({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; periodo?: string }>;
}) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const { vista, periodo } = await searchParams;
  const periodoElegido: PeriodoDelMapa =
    periodo && periodo in PERIODOS_DEL_MAPA ? (periodo as PeriodoDelMapa) : "mes";
  const [reportes, mapa, guia] = await Promise.all([
    misQuejas(sesion),
    mapaDeIncidentes(sesion, new Date(), periodoElegido),
    guiaDeSeccion(sesion.usuarioId, "INCIDENTES"),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Incidentes del barrio"
        accion={
          <BotonEnlace href="/incidentes/reportar" icono={Megaphone} anchoCompleto>
            Reportar un problema
          </BotonEnlace>
        }
      />
      {/* Una sola columna también en escritorio: todo va dentro de un bloque a todo el ancho. */}
      <div data-ancho="completo" className="flex flex-col gap-6">
        <BuscarPorCodigo />
        {guia.ofrecer && (
          <OfertaDeGuia seccion="INCIDENTES" enPausa={guia.estado === "PAUSADA"} paso={guia.paso} />
        )}
        <section aria-labelledby="titulo-mis-reportes" className="flex flex-col gap-4">
          <h2 id="titulo-mis-reportes" className="text-titulo-2">
            Mis reportes
          </h2>
          {reportes.length ? (
            <ListaVerMas
              etiqueta="Mis reportes"
              columnas={3}
              elementos={reportes.map((r) => (
                <Link
                  key={r.id}
                  href={`/incidentes/${r.id}`}
                  className="flex h-full items-center gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <strong>
                      {r.numero} · {r.categoria}
                    </strong>
                    <span className="text-texto-secundario">
                      {r.lugar} · {fechaCorta(new Date(r.fechaRegistro), { conAnio: false })}
                    </span>
                    <InsigniaDeEstado estado={r.estado} texto={r.estadoTexto} />
                  </div>
                  <ChevronRight aria-hidden className="size-icono shrink-0" />
                </Link>
              ))}
            />
          ) : (
            <div role="status" className="flex flex-col gap-1 rounded-tarjeta bg-fondo-suave p-4 senior:p-6">
              <strong>Todavía no ha hecho reportes</strong>
              <span className="text-texto-secundario">Cuando reporte algo, aquí verá cómo avanza.</span>
            </div>
          )}
        </section>
        <IncidentesDelBarrio
          mapa={mapa}
          vista={vista && vista in VISTAS ? (vista as Vista) : "lista"}
          periodo={periodoElegido}
        />
      </div>
    </div>
  );
}
