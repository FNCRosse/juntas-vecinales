import { ChevronRight, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { ICONO_CATEGORIA } from "@/app/_incidentes/iconos";
import { InsigniaDeEstado } from "@/app/_incidentes/InsigniaDeEstado";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { EncabezadoPagina } from "@/componentes/a11y/EncabezadoPagina";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { fechaYHora } from "@/compartido/fechas";
import {
  bandejaDeQuejas,
  FILTROS_BANDEJA,
  type FiltroBandeja,
} from "@/modulos/incidencias/aplicacion/quejas";

export const metadata: Metadata = { title: "Incidentes" };

// DIR-QUE-01 (HU-QUE-04): la bandeja de reportes, los más nuevos arriba, con su número, lugar, estado
// y la fecha y hora en que llegaron; filtro por estado en la URL.
export default async function BandejaIncidentes({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const { estado } = await searchParams;
  const filtro: FiltroBandeja = estado && estado in FILTROS_BANDEJA ? (estado as FiltroBandeja) : "todos";
  const { conteo, quejas } = await bandejaDeQuejas(sesion, filtro);
  const etiquetaFiltro = (clave: FiltroBandeja) =>
    clave === "porEvaluar"
      ? `Por evaluar (${conteo.porEvaluar})`
      : clave === "enRevision"
        ? `En revisión (${conteo.enRevision})`
        : FILTROS_BANDEJA[clave].etiqueta;
  const cerrados = conteo.total - conteo.porEvaluar - conteo.enRevision;

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Incidentes"
        descripcion={`${conteo.total === 1 ? "1 reporte" : `${conteo.total} reportes`}: ${conteo.porEvaluar} por evaluar, ${conteo.enRevision} en revisión, ${cerrados} ${cerrados === 1 ? "cerrado" : "cerrados"}.`}
        accion={
          <BotonEnlace href="/directiva/incidentes/asistido" icono={UserPlus} anchoCompleto>
            Registrar un reporte por un vecino
          </BotonEnlace>
        }
      />
      <SelectorDeFiltro
        id="estado-reportes"
        pregunta="Mostrar"
        valor={filtro}
        opciones={(Object.keys(FILTROS_BANDEJA) as FiltroBandeja[]).map((clave) => ({
          valor: clave,
          etiqueta: etiquetaFiltro(clave),
          href: clave === "todos" ? "/directiva/incidentes" : `/directiva/incidentes?estado=${clave}`,
        }))}
      />
      {quejas.length ? (
        <ListaVerMas
          etiqueta="Reportes"
          elementos={quejas.map((q) => {
            const Icono = ICONO_CATEGORIA[q.categoria];
            return (
              <Link
                key={q.id}
                href={`/directiva/incidentes/${q.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
              >
                <Icono aria-hidden className="size-icono shrink-0 text-accion-primaria" />
                <span className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
                  <span className="text-pequeno text-texto-secundario">
                    {q.numero} · {fechaYHora(new Date(q.fechaRegistro))}
                  </span>
                  <strong className="text-titulo-3">{q.categoriaTexto}</strong>
                  <span>
                    {q.lugar} · {q.quien}
                  </span>
                </span>
                <InsigniaDeEstado estado={q.estado} texto={q.estadoTexto} />
                <span className="inline-flex items-center gap-1 font-bold text-texto-enlace">
                  {q.estado === "RECIBIDO" ? "Evaluar" : "Ver el reporte"}
                  <ChevronRight aria-hidden className="size-icono" />
                </span>
              </Link>
            );
          })}
        />
      ) : (
        <div role="status" className="flex flex-col gap-1 rounded-control bg-fondo-suave p-4">
          <strong>No hay reportes en esta lista</strong>
          <span>Cuando un vecino envíe uno, aparecerá aquí y le llegará una alerta.</span>
        </div>
      )}
    </div>
  );
}
