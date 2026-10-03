import { ChevronRight, Info, Megaphone, Search } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { OfertaDeGuia } from "@/app/_guias/OfertaDeGuia";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { fechaLarga } from "@/compartido/fechas";
import { guiaDeSeccion } from "@/modulos/accesibilidad/aplicacion/guias";
import { mapaDeIncidentes } from "@/modulos/incidencias/aplicacion/mapa";
import { misQuejas } from "@/modulos/incidencias/aplicacion/quejas";
import { IncidentesDelBarrio, VISTAS, type Vista } from "./_componentes/IncidentesDelBarrio";

export const metadata: Metadata = { title: "Incidentes del barrio" };

// VEC-QUE-01 a VEC-QUE-03 (HU-QUE-01, HU-QUE-04, HU-QUE-08): reportar un problema, ver los reportes propios
// con su estado y los del barrio como lista, mapa o resumen.
export default async function Incidentes({ searchParams }: { searchParams: Promise<{ vista?: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const { vista } = await searchParams;
  const [reportes, mapa, guia] = await Promise.all([
    misQuejas(sesion),
    mapaDeIncidentes(sesion),
    guiaDeSeccion(sesion.usuarioId, "INCIDENTES"),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Incidentes del barrio</h1>
      {guia.ofrecer && <OfertaDeGuia seccion="INCIDENTES" enPausa={guia.estado === "PAUSADA"} />}
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
                <Link
                  href={`/incidentes/${r.id}`}
                  className="flex items-center gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
                >
                  <div className="flex flex-1 flex-col gap-1">
                    <strong>
                      {r.numero} · {r.categoria}
                    </strong>
                    <span className="text-texto-secundario">
                      {r.lugar} · {fechaLarga(new Date(r.fechaRegistro))}
                    </span>
                    <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
                      <Info aria-hidden className="size-icono-pequeno" />
                      {r.estadoTexto}
                    </span>
                  </div>
                  <ChevronRight aria-hidden className="size-icono shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div role="status" className="flex flex-col gap-1 rounded-control bg-fondo-suave p-4">
            <strong>Todavía no ha hecho reportes</strong>
            <span>Cuando reporte algo, aquí verá cómo avanza.</span>
          </div>
        )}
        <Link
          href="/seguimiento"
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <Search aria-hidden className="size-icono" />
          Tengo un código de seguimiento
        </Link>
      </section>
      <IncidentesDelBarrio mapa={mapa} vista={vista && vista in VISTAS ? (vista as Vista) : "lista"} />
    </div>
  );
}
