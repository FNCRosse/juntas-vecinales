import { Bell } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { FilaEnlace } from "@/componentes/a11y/Tarjeta";
import { Volver } from "@/componentes/a11y/Volver";
import { bandejasDeLaDirectiva } from "../_bandejas";

export const metadata: Metadata = { title: "Para atender" };

// DIR-INI-01 "Para atender" (prototipo DIN05): una fila por bandeja con cuántas hay, primero las que tienen algo
// pendiente (R-11: 5 y "Ver más"; 3 en vista grande), y el camino a todas las alertas.
export default async function ParaAtender() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const { texto, ordenadas } = await bandejasDeLaDirectiva(sesion);
  return (
    <div className="flex flex-col gap-6">
      <Volver href="/directiva">Volver al resumen</Volver>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Para atender</h1>
        <p className="text-texto-secundario">{texto}. Lo pendiente, arriba.</p>
      </div>
      <ListaVerMas
        etiqueta="Lo que hay que atender"
        elementos={ordenadas.map((b) => (
          <FilaEnlace
            key={b.titulo}
            href={b.href}
            icono={b.icono}
            titulo={b.titulo}
            detalle={b.detalle}
            extra={
              <span
                className={`shrink-0 rounded-pastilla border px-3 text-pequeno font-bold ${
                  b.n === 0
                    ? "border-borde-exito bg-fondo-exito text-texto-exito"
                    : "border-borde-info bg-fondo-info text-texto-info"
                }`}
              >
                {b.n}
                <span className="sr-only">
                  {b.n === 0 ? " pendientes: nada pendiente" : b.n === 1 ? " pendiente" : " pendientes"}
                </span>
              </span>
            }
          />
        ))}
      />
      <BotonEnlace href="/directiva/alertas" variante="secundario" icono={Bell} anchoCompleto>
        Ver todas las alertas de la directiva
      </BotonEnlace>
    </div>
  );
}
