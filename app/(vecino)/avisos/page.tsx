import { Bell, Info, Settings } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { FiltroEnHoja } from "@/componentes/a11y/FiltroEnHoja";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { FILTROS, type Filtro, verAvisos } from "@/modulos/identidad/aplicacion/avisos";
import { MarcarLeido, MarcarTodos } from "./Marcar";

export const metadata: Metadata = { title: "Avisos" };

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR"] as const;

// VEC-ACC-11 Avisos (HU-GAR-20): todos los avisos, los más nuevos arriba, con su origen; filtro por
// tipo en la URL, detrás de un solo botón "Filtrar" (R-11); 5 avisos (3 en vista grande) y "Ver más".
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
      <FiltroEnHoja
        actual={FILTROS[filtro].etiqueta}
        titulo="Mostrar avisos de"
        opciones={(Object.keys(FILTROS) as Filtro[]).map((clave) => ({
          etiqueta: FILTROS[clave].etiqueta,
          href: clave === "todos" ? "/avisos" : `/avisos?tipo=${clave}`,
          activa: clave === filtro,
        }))}
        pie={
          <BotonEnlace href="/avisos/preferencias" variante="secundario" icono={Settings}>
            Elegir qué avisos recibo
          </BotonEnlace>
        }
      />

      {avisos.length ? (
        <ListaVerMas
          etiqueta="Avisos"
          elementos={avisos.map((a) => (
            <article
              key={a.id}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta"
            >
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
          ))}
        />
      ) : (
        <div role="status" className="flex flex-col items-center gap-2 p-6 text-center">
          <Bell aria-hidden className="size-icono text-texto-secundario" />
          <strong>No tiene avisos de este tipo</strong>
          <span>Cuando llegue uno, lo verá aquí.</span>
        </div>
      )}

      {noLeidos > 0 && <MarcarTodos />}
    </div>
  );
}
