import { Info, Megaphone } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { fechaLarga } from "@/compartido/fechas";
import { misQuejas } from "@/modulos/incidencias/aplicacion/quejas";

export const metadata: Metadata = { title: "Incidentes del barrio" };

// VEC-QUE-01 (HU-QUE-01, HU-QUE-04): reportar un problema y ver los reportes propios con su estado.
export default async function Incidentes() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const reportes = await misQuejas(sesion);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Incidentes del barrio</h1>
      <BotonEnlace href="/incidentes/reportar" icono={Megaphone} anchoCompleto>
        Reportar un problema
      </BotonEnlace>
      <section aria-labelledby="titulo-mis-reportes" className="flex flex-col gap-4">
        <h2 id="titulo-mis-reportes" className="text-titulo-2">
          Mis reportes
        </h2>
        {reportes.length ? (
          <ul className="flex flex-col gap-separacion">
            {reportes.map((r) => (
              <li key={r.id}>
                <article className="flex items-center gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6">
                  <div className="flex flex-1 flex-col gap-1">
                    <h3 className="font-bold">
                      {r.numero} · {r.categoria}
                    </h3>
                    <span className="text-texto-secundario">
                      {r.lugar} · {fechaLarga(new Date(r.fechaRegistro))}
                    </span>
                    <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
                      <Info aria-hidden className="size-icono-pequeno" />
                      {r.estadoTexto}
                    </span>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div role="status" className="flex flex-col gap-1 rounded-control bg-fondo-suave p-4">
            <strong>Todavía no ha hecho reportes</strong>
            <span>Cuando reporte algo, aquí verá cómo avanza.</span>
          </div>
        )}
      </section>
    </div>
  );
}
