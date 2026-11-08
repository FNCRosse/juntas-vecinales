import {
  CalendarClock,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  HandHeart,
  Lock,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Insignia, type TonoInsignia } from "@/componentes/a11y/Insignia";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";
import { fechaLarga, horaCorta } from "@/compartido/fechas";
import type { ActividadDto } from "@/modulos/asambleas/aplicacion/actividades";

// La lista de actividades pro-fondos, la misma para la directiva y los vecinos: un filtro por estado (en la URL) y una
// tarjeta por actividad que abre su detalle. El estado nunca va solo por color: ícono y palabra (WCAG 1.4.1).

export type EstadoActividad = "proximas" | "por-publicar" | "publicadas";

const ESTADOS: Record<EstadoActividad, { texto: string; tono: TonoInsignia; icono: LucideIcon }> = {
  proximas: { texto: "Próxima", tono: "info", icono: CalendarClock },
  "por-publicar": { texto: "Balance por publicar", tono: "aviso", icono: ClipboardList },
  publicadas: { texto: "Balance publicado", tono: "exito", icono: Lock },
};

/** Una actividad es próxima hasta su hora; después, su balance está por publicar o ya publicado. */
export function estadoDe(actividad: ActividadDto, publicadas: Set<string>, ahora: Date): EstadoActividad {
  if (new Date(actividad.fechaHora) > ahora) return "proximas";
  return publicadas.has(actividad.id) ? "publicadas" : "por-publicar";
}

export function ListaDeActividades({
  actividades,
  publicadas,
  filtro,
  ruta,
  textoFiltro,
  soloPublicas = false,
}: {
  actividades: ActividadDto[];
  /** Los id de las actividades que ya tienen su balance publicado. */
  publicadas: Set<string>;
  filtro: string | undefined;
  /** De dónde cuelga cada detalle: «/directiva/actividades» o «/actividades». */
  ruta: string;
  /** Cómo se nombra el estado «por publicar» para quien mira (los vecinos esperan el balance). */
  textoFiltro: Record<EstadoActividad, string>;
  /** Los vecinos solo ven las próximas y las que ya tienen su balance publicado: las que esperan su balance, no. */
  soloPublicas?: boolean;
}) {
  const ahora = new Date();
  const conEstado = actividades
    .map((a) => ({ a, estado: estadoDe(a, publicadas, ahora) }))
    .filter((x) => !soloPublicas || x.estado !== "por-publicar");
  const elegido =
    filtro && filtro in ESTADOS && !(soloPublicas && filtro === "por-publicar")
      ? (filtro as EstadoActividad)
      : "todas";
  // Las próximas, de la más cercana a la más lejana; las que ya pasaron, de la más reciente a la más antigua.
  const ordenadas = [
    ...conEstado.filter((x) => x.estado === "proximas"),
    ...conEstado.filter((x) => x.estado !== "proximas").reverse(),
  ];
  const visibles = elegido === "todas" ? ordenadas : ordenadas.filter((x) => x.estado === elegido);
  const cuantas = (e: EstadoActividad) => conEstado.filter((x) => x.estado === e).length;
  const opciones = [
    { valor: "todas", etiqueta: "Todas las actividades", detalle: String(conEstado.length), href: ruta },
    ...(Object.keys(ESTADOS) as EstadoActividad[])
      .filter((e) => !soloPublicas || e !== "por-publicar")
      .map((e) => ({
        valor: e,
        etiqueta: textoFiltro[e],
        detalle: String(cuantas(e)),
        href: `${ruta}?estado=${e}`,
      })),
  ];
  return (
    <>
      <SelectorDeFiltro id="campo-estado-actividad" pregunta="Mostrar" valor={elegido} opciones={opciones} />
      {visibles.length ? (
        <div data-ancho="completo" className="flex flex-col gap-separacion">
          <ListaVerMas
            etiqueta="Actividades pro-fondos"
            elementos={visibles.map(({ a, estado }) => {
              const fecha = new Date(a.fechaHora);
              const { texto, tono, icono } = ESTADOS[estado];
              return (
                <Link
                  key={a.id}
                  href={`${ruta}/${a.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
                >
                  <span
                    aria-hidden
                    className="flex size-12 shrink-0 items-center justify-center rounded-control bg-fondo-suave text-accion-primaria"
                  >
                    <HandHeart className="size-icono" />
                  </span>
                  <span className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
                    <span className="text-pequeno text-texto-secundario">
                      {fechaLarga(fecha)} · {horaCorta(fecha)}
                    </span>
                    <strong className="text-titulo-3">{a.nombre}</strong>
                    <span>
                      {a.tipoTexto} · {a.precioTexto} por {a.unidad.singular} · {a.lugar}
                    </span>
                  </span>
                  <Insignia tono={tono} icono={icono}>
                    {texto}
                  </Insignia>
                  <span className="inline-flex items-center gap-1 font-bold text-texto-enlace">
                    Ver la actividad
                    <ChevronRight aria-hidden className="size-icono" />
                  </span>
                </Link>
              );
            })}
          />
        </div>
      ) : (
        <div role="status" className="flex flex-col items-center gap-2 px-4 pt-8 pb-4 text-center">
          <CircleCheck aria-hidden className="size-icono text-texto-secundario" />
          <strong>No hay actividades de este tipo</strong>
          <span className="text-texto-secundario">Elija otro filtro para ver el resto.</span>
        </div>
      )}
    </>
  );
}
