import { BookOpen, CircleCheck, Clock } from "lucide-react";
import type { Metadata } from "next";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { InterruptorLetraGrande } from "@/componentes/a11y/InterruptorLetraGrande";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { obtenerPerfil } from "@/modulos/accesibilidad/aplicacion/obtenerPerfil";
import { InterruptorVoz } from "@/app/_accesibilidad/InterruptorVoz";
import { guiasDeUso } from "@/modulos/accesibilidad/aplicacion/guias";
import { misSolicitudes } from "@/modulos/accesibilidad/aplicacion/mediacion";

export const metadata: Metadata = { title: "Ayuda y accesibilidad" };

// VEC-AYU-03 (HU-ACC-01, HU-ACC-02 CA1, HU-ACC-04 CA3, HU-ACC-10 CA2): "Vista grande", la lectura en voz alta,
// las guías de uso de cada sección y el estado de sus pedidos de ayuda.
export default async function AyudaYAccesibilidad() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const [pedidos, senior, perfil, guias] = await Promise.all([
    misSolicitudes(sesion.usuarioId),
    modoSeniorAlRenderizar(),
    obtenerPerfil({ usuarioId: sesion.usuarioId }),
    guiasDeUso(sesion.usuarioId),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Ayuda y accesibilidad</h1>
      <Tarjeta titulo="Cómo se ve y se escucha">
        <div className="self-start">
          <InterruptorLetraGrande activoAlInicio={senior} />
        </div>
        <InterruptorVoz activoAlInicio={perfil.sintesisVozActiva} />
      </Tarjeta>
      <Tarjeta titulo="Guías de uso">
        <ul className="flex flex-col gap-3">
          <li className="flex flex-wrap items-center justify-between gap-2 border-b border-borde-sutil pb-3">
            <span className="flex flex-col">
              <strong>Primeros pasos</strong>
              <span className="text-pequeno text-texto-secundario">
                Cómo ver la aplicación y cómo tenerla en su pantalla
              </span>
            </span>
            <BotonEnlace href="/guia" variante="secundario" icono={BookOpen}>
              Ver la guía<span className="sr-only"> de primeros pasos</span>
            </BotonEnlace>
          </li>
          {guias.map((g) => (
            <li
              key={g.seccion}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-borde-sutil pb-3 last:border-b-0"
            >
              <span className="flex flex-col">
                <strong>{g.nombre}</strong>
                <span className="text-pequeno text-texto-secundario">{g.estado}</span>
              </span>
              <BotonEnlace
                href={`/guia/${g.seccion.toLowerCase()}?desde=inicio`}
                variante="secundario"
                icono={BookOpen}
              >
                Ver la guía<span className="sr-only"> de {g.nombre}</span>
              </BotonEnlace>
            </li>
          ))}
        </ul>
      </Tarjeta>
      <Tarjeta titulo="Mis pedidos de ayuda">
        {pedidos.length ? (
          <ul className="flex flex-col gap-3">
            {pedidos.map((p) => (
              <li key={p.id} className="flex flex-col border-b border-borde-sutil pb-3 last:border-b-0">
                <strong>Ayuda en: {p.pantalla}</strong>
                <span className="text-texto-secundario">
                  N.° {p.numero} · {fechaYHora(new Date(p.fecha))}
                </span>
                <span
                  className={`inline-flex items-center gap-2 font-bold ${p.estado === "ATENDIDA" ? "text-texto-exito" : "text-texto-aviso"}`}
                >
                  {p.estado === "ATENDIDA" ? (
                    <CircleCheck aria-hidden className="size-icono-pequeno" />
                  ) : (
                    <Clock aria-hidden className="size-icono-pequeno" />
                  )}
                  {p.estadoTexto}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Todavía no pidió ayuda. Si algo se le complica, use el botón Pedir ayuda de arriba.</p>
        )}
      </Tarjeta>
    </div>
  );
}
