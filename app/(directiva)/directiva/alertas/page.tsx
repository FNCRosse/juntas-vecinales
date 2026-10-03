import { Bell, ChevronLeft, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { verAvisos } from "@/modulos/identidad/aplicacion/avisos";

export const metadata: Metadata = { title: "Alertas de la directiva" };

// DIR-INI-02 (HU-QUE-04 CA2): las alertas que le llegan a quien es de la directiva, las más nuevas arriba.
export default async function AlertasDirectiva() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const { avisos } = await verAvisos(sesion);
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al resumen
      </Link>
      <h1 className="text-titulo-1">Alertas de la directiva</h1>
      {avisos.length ? (
        <ul className="flex flex-col gap-separacion" aria-label="Alertas">
          {avisos.map((a) => (
            <li key={a.id}>
              <article className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6">
                <div className="flex flex-wrap items-center gap-3 text-pequeno">
                  <span className="font-bold">{a.origen}</span>
                  <span className="text-texto-secundario">{fechaYHora(new Date(a.fecha))}</span>
                  {a.nuevo && (
                    <span className="inline-flex items-center gap-1 rounded-pastilla border border-borde-info bg-fondo-info px-3 font-bold text-texto-info">
                      <Info aria-hidden className="size-icono-pequeno" />
                      Nueva
                    </span>
                  )}
                </div>
                <h2 className="text-titulo-3">{a.titulo}</h2>
                <p>{a.texto}</p>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div role="status" className="flex flex-col items-center gap-2 p-6 text-center">
          <Bell aria-hidden className="size-icono text-texto-secundario" />
          <strong>No hay alertas</strong>
          <span>Cuando llegue un reporte o un pedido, lo verá aquí.</span>
        </div>
      )}
    </div>
  );
}
