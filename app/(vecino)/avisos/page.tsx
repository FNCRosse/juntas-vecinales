import { Bell, Check, Info, Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { FILTROS, type Filtro, verAvisos } from "@/modulos/identidad/aplicacion/avisos";
import { MarcarLeido, MarcarTodos } from "./Marcar";

export const metadata: Metadata = { title: "Avisos" };

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR"] as const;

// VEC-ACC-11 Avisos (HU-GAR-20): todos los avisos, los más nuevos arriba, con su origen; filtro por
// tipo en la URL y marcar como leídos.
export default async function Avisos({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const sesion = await exigirActor([...ROLES_VECINO], "/entrar");
  const { tipo } = await searchParams;
  const filtro: Filtro = tipo && tipo in FILTROS ? (tipo as Filtro) : "todos";
  const { avisos, noLeidos } = await verAvisos(sesion, filtro);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Avisos</h1>
        <p className="text-texto-secundario">
          {noLeidos === 1 ? "1 sin leer" : `${noLeidos} sin leer`} · los más nuevos arriba
        </p>
      </div>
      <nav aria-label="Mostrar avisos de" className="flex flex-wrap gap-separacion">
        {(Object.keys(FILTROS) as Filtro[]).map((clave) => {
          const activo = clave === filtro;
          return (
            <Link
              key={clave}
              href={clave === "todos" ? "/avisos" : `/avisos?tipo=${clave}`}
              aria-current={activo ? "true" : undefined}
              className={`inline-flex min-h-tactil items-center gap-2 rounded-pastilla border-(length:--borde-ancho-control) px-4 font-bold no-underline ${activo ? "border-accion-primaria bg-accion-primaria text-texto-invertido" : "border-borde-control bg-fondo-superficie text-accion-primaria hover:bg-accion-secundaria-hover"}`}
            >
              {activo && <Check aria-hidden className="size-icono-pequeno" />}
              {FILTROS[clave].etiqueta}
            </Link>
          );
        })}
      </nav>

      {avisos.length ? (
        <ul className="flex flex-col gap-separacion" aria-label="Avisos">
          {avisos.map((a) => (
            <li key={a.id}>
              <article className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta">
                <div className="flex flex-wrap items-center gap-3 text-pequeno">
                  <span className="font-bold">{a.origen}</span>
                  <span className="text-texto-secundario">{fechaYHora(new Date(a.fecha))}</span>
                  {a.nuevo && (
                    <span className="inline-flex items-center gap-1 rounded-pastilla border border-borde-info bg-fondo-info px-3 font-bold text-texto-info">
                      <Info aria-hidden className="size-icono-pequeno" />
                      Nuevo
                    </span>
                  )}
                </div>
                <h2 className="text-titulo-3">{a.titulo}</h2>
                <p>{a.texto}</p>
                {a.nuevo && <MarcarLeido id={a.id} titulo={a.titulo} />}
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div role="status" className="flex flex-col items-center gap-2 p-6 text-center">
          <Bell aria-hidden className="size-icono text-texto-secundario" />
          <strong>No tiene avisos de este tipo</strong>
          <span>Cuando llegue uno, lo verá aquí.</span>
        </div>
      )}

      <div className="flex flex-col gap-separacion md:flex-row">
        {noLeidos > 0 && <MarcarTodos />}
        <BotonEnlace href="/avisos/preferencias" variante="secundario" icono={Settings}>
          Elegir qué avisos recibo
        </BotonEnlace>
      </div>
    </div>
  );
}
