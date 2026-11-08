import { ChevronRight, CircleCheck, Megaphone, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { EncabezadoPagina } from "@/componentes/a11y/EncabezadoPagina";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";
import { fechaYHora } from "@/compartido/fechas";
import { comunicadosDeLaDirectiva, type NoticiaDto } from "@/modulos/transparencia/aplicacion/comunicados";
import { InsigniasDeComunicado } from "./_componentes/InsigniasDeComunicado";

export const metadata: Metadata = { title: "Comunicados a la comunidad" };

const RUTA = "/directiva/comunicados";
const FILTROS: Record<string, { etiqueta: string; cumple: (c: NoticiaDto) => boolean }> = {
  todos: { etiqueta: "Todos los comunicados", cumple: () => true },
  urgentes: { etiqueta: "Urgentes", cumple: (c) => c.urgencia === "URGENTE" && !c.corregidoPorId },
  informativos: {
    etiqueta: "Informativos",
    cumple: (c) => c.urgencia === "INFORMATIVO" && !c.corregidoPorId,
  },
  corregidos: { etiqueta: "Corregidos", cumple: (c) => c.corregidoPorId !== null },
};

// DIR-ASA-14 (HU-ASA-15): todos los comunicados publicados, los más nuevos arriba, con un filtro (R-11) y el botón para publicar
// uno nuevo. Cada uno abre su detalle, donde se publica una corrección: un comunicado no se edita ni se borra.
export default async function Comunicados({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const [comunicados, { tipo }] = await Promise.all([comunicadosDeLaDirectiva(sesion), searchParams]);
  const elegido = tipo && tipo in FILTROS ? tipo : "todos";
  const visibles = comunicados.filter(FILTROS[elegido].cumple);
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Comunicados a la comunidad"
        descripcion="Cortes de servicio, seguridad o trámites. Los urgentes salen primero en las noticias de los vecinos."
        accion={
          <BotonEnlace href="/directiva/comunicados/nuevo" icono={Plus} anchoCompleto>
            Nuevo comunicado
          </BotonEnlace>
        }
      />
      <SelectorDeFiltro
        id="campo-tipo-comunicado"
        pregunta="Mostrar"
        valor={elegido}
        opciones={Object.entries(FILTROS).map(([valor, { etiqueta, cumple }]) => ({
          valor,
          etiqueta,
          detalle: String(comunicados.filter(cumple).length),
          href: valor === "todos" ? RUTA : `${RUTA}?tipo=${valor}`,
        }))}
      />
      {visibles.length ? (
        <div data-ancho="completo" className="flex flex-col gap-separacion">
          <ListaVerMas
            etiqueta="Comunicados"
            elementos={visibles.map((c) => (
              <Link
                key={c.id}
                href={`${RUTA}/${c.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
              >
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-control bg-fondo-suave text-accion-primaria"
                >
                  <Megaphone className="size-icono" />
                </span>
                <span className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
                  <span className="text-pequeno text-texto-secundario">
                    {fechaYHora(new Date(c.fecha))} · {c.autor}
                  </span>
                  <strong className="text-titulo-3">{c.titulo}</strong>
                  <span className="line-clamp-2 text-texto-secundario">{c.cuerpo}</span>
                  <InsigniasDeComunicado comunicado={c} />
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-texto-enlace">
                  Ver el comunicado
                  <ChevronRight aria-hidden className="size-icono" />
                </span>
              </Link>
            ))}
          />
        </div>
      ) : (
        <div role="status" className="flex flex-col items-center gap-2 px-4 pt-8 pb-4 text-center">
          <CircleCheck aria-hidden className="size-icono text-texto-secundario" />
          <strong>No hay comunicados de este tipo</strong>
          <span className="text-texto-secundario">Elija otro filtro o publique uno nuevo.</span>
        </div>
      )}
    </div>
  );
}
