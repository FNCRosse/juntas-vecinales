import { Check, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
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
  const cerrados = conteo.total - conteo.porEvaluar - conteo.enRevision;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Incidentes</h1>
        <p className="text-texto-secundario">
          {conteo.total === 1 ? "1 reporte" : `${conteo.total} reportes`}: {conteo.porEvaluar} por evaluar,{" "}
          {conteo.enRevision} en revisión, {cerrados} {cerrados === 1 ? "cerrado" : "cerrados"}.
        </p>
      </div>
      <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-separacion">
        {(Object.keys(FILTROS_BANDEJA) as FiltroBandeja[]).map((clave) => {
          const activo = clave === filtro;
          const etiqueta =
            clave === "porEvaluar"
              ? `Por evaluar (${conteo.porEvaluar})`
              : clave === "enRevision"
                ? `En revisión (${conteo.enRevision})`
                : FILTROS_BANDEJA[clave].etiqueta;
          return (
            <Link
              key={clave}
              href={clave === "todos" ? "/directiva/incidentes" : `/directiva/incidentes?estado=${clave}`}
              aria-current={activo ? "true" : undefined}
              className={`inline-flex min-h-tactil items-center gap-2 rounded-pastilla border-(length:--borde-ancho-control) px-4 font-bold no-underline ${activo ? "border-accion-primaria bg-accion-primaria text-texto-invertido" : "border-borde-control bg-fondo-superficie text-accion-primaria hover:bg-accion-secundaria-hover"}`}
            >
              {activo && <Check aria-hidden className="size-icono-pequeno" />}
              {etiqueta}
            </Link>
          );
        })}
      </nav>
      {quejas.length ? (
        <ul className="flex flex-col gap-separacion" aria-label="Reportes">
          {quejas.map((q) => (
            <li key={q.id}>
              <article className="flex flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6">
                <span className="text-pequeno text-texto-secundario">
                  {q.numero} · {fechaYHora(new Date(q.fechaRegistro))}
                </span>
                <h2 className="text-titulo-3">{q.categoriaTexto}</h2>
                <span>{q.lugar}</span>
                <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
                  <Info aria-hidden className="size-icono-pequeno" />
                  {q.estadoTexto}
                </span>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div role="status" className="flex flex-col gap-1 rounded-control bg-fondo-suave p-4">
          <strong>No hay reportes en esta lista</strong>
          <span>Cuando un vecino envíe uno, aparecerá aquí y le llegará una alerta.</span>
        </div>
      )}
    </div>
  );
}
