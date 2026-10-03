import { CircleCheck, Clock, LifeBuoy } from "lucide-react";
import type { Metadata } from "next";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { InterruptorLetraGrande } from "@/componentes/a11y/InterruptorLetraGrande";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { obtenerPerfil } from "@/modulos/accesibilidad/aplicacion/obtenerPerfil";
import { InterruptorVoz } from "@/app/_accesibilidad/InterruptorVoz";
import { misSolicitudes } from "@/modulos/accesibilidad/aplicacion/mediacion";

export const metadata: Metadata = { title: "Ayuda y accesibilidad" };

// VEC-AYU-03 (HU-ACC-01, HU-ACC-02 CA1, HU-ACC-04 CA3): "Letra grande" y la lectura en voz alta también aquí y el estado de sus pedidos de
// ayuda. Las guías llegan con HU-ACC-10.
export default async function AyudaYAccesibilidad() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const [pedidos, senior, perfil] = await Promise.all([
    misSolicitudes(sesion.usuarioId),
    modoSeniorAlRenderizar(),
    obtenerPerfil({ usuarioId: sesion.usuarioId }),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Ayuda y accesibilidad</h1>
      <Tarjeta titulo="Cómo se ve">
        <p>La letra grande también agranda los botones y sube el contraste. Se guarda en su cuenta.</p>
        <div className="self-start">
          <InterruptorLetraGrande activoAlInicio={senior} />
        </div>
      </Tarjeta>
      <Tarjeta titulo="Lectura en voz alta">
        <p>El teléfono le lee las noticias de la junta, para que no tenga que leerlas en pantalla.</p>
        <InterruptorVoz activoAlInicio={perfil.sintesisVozActiva} />
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
        <BotonEnlace
          href="/mas/ayuda?desde=/mas/ayuda-y-accesibilidad"
          variante="secundario"
          icono={LifeBuoy}
        >
          Pedir ayuda a una persona
        </BotonEnlace>
      </Tarjeta>
    </div>
  );
}
