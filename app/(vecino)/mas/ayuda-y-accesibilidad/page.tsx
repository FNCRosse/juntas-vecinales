import { CircleCheck, Clock, Play } from "lucide-react";
import type { Metadata } from "next";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { Insignia } from "@/componentes/a11y/Insignia";
import { InterruptorLetraGrande } from "@/componentes/a11y/InterruptorLetraGrande";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { obtenerPerfil } from "@/modulos/accesibilidad/aplicacion/obtenerPerfil";
import { InterruptorVoz } from "@/app/_accesibilidad/InterruptorVoz";
import { guiasDeUso } from "@/modulos/accesibilidad/aplicacion/guias";
import { misSolicitudes } from "@/modulos/accesibilidad/aplicacion/mediacion";

export const metadata: Metadata = { title: "Ayuda y accesibilidad" };

/** Una fila de "Guías de uso": la sección y su estado a la izquierda, "Ver la guía" a la derecha. */
function FilaGuia({ nombre, estado, href }: { nombre: string; estado: string; href: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-borde-sutil py-2">
      <span className="flex flex-col">
        <strong>{nombre}</strong>
        <span className="text-pequeno text-texto-secundario">{estado}</span>
      </span>
      <BotonEnlace href={href} variante="secundario" icono={Play} compacto>
        Ver la guía<span className="sr-only"> de {nombre}</span>
      </BotonEnlace>
    </li>
  );
}

// VEC-AYU-03 (HU-ACC-01, HU-ACC-02 CA1, HU-ACC-04 CA3, HU-ACC-10 CA2): "Vista grande", la lectura en voz alta,
// las guías de uso de cada sección y, si los hay, el estado de sus pedidos de ayuda.
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
        <div className="flex">
          <InterruptorLetraGrande activoAlInicio={senior} />
        </div>
        <InterruptorVoz activoAlInicio={perfil.sintesisVozActiva} />
      </Tarjeta>
      <Tarjeta titulo="Guías de uso">
        <ul className="flex flex-col">
          <FilaGuia
            nombre="Guía rápida y tener la app en su pantalla"
            estado="Cómo ver la aplicación y cómo agregar su ícono al teléfono"
            href="/guia"
          />
          {guias.map((g) => (
            <FilaGuia
              key={g.seccion}
              nombre={g.nombre}
              estado={g.estado}
              href={`/guia/${g.seccion.toLowerCase()}?desde=inicio`}
            />
          ))}
        </ul>
      </Tarjeta>
      {pedidos.length > 0 && (
        <section aria-labelledby="mis-pedidos" className="flex flex-col gap-separacion">
          <h2 id="mis-pedidos" className="text-titulo-3">
            Mis pedidos de ayuda
          </h2>
          <ul className="flex flex-col gap-separacion">
            {pedidos.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6"
              >
                <strong>Ayuda en: {p.pantalla}</strong>
                <span className="text-texto-secundario">
                  N.° {p.numero} · {fechaYHora(new Date(p.fecha))}
                </span>
                {p.estado === "ATENDIDA" ? (
                  <Insignia tono="exito" icono={CircleCheck}>
                    {p.estadoTexto}
                  </Insignia>
                ) : (
                  <Insignia tono="aviso" icono={Clock}>
                    {p.estadoTexto}
                  </Insignia>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
