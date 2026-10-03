import { Bell, ChevronRight, FileText, Info, Landmark, MapPin, Megaphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { sesionActual } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { fechaLarga, primerNombre, saludo } from "@/compartido/fechas";
import { quejasPorAtender } from "@/modulos/incidencias/aplicacion/quejas";

export const metadata: Metadata = { title: "Resumen de la directiva" };

// DIR-INI-01. Las bandejas y lo que se puede crear llegan con las HU de cada módulo.
export default async function ResumenDirectiva() {
  const sesion = await sesionActual();
  const ahora = new Date();
  const quejas = sesion && (await quejasPorAtender(sesion));
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-titulo-1">
        {saludo(ahora)}, {primerNombre(sesion?.nombreCompleto ?? "")}
      </h1>
      <p className="text-texto-secundario">{fechaLarga(ahora)} · Resumen de la directiva</p>
      {sesion && (
        <div className="pt-4">
          <CambiarDePerfil sesion={sesion} actual="directiva" estilo="boton" />
        </div>
      )}
      {quejas && (
        <section aria-labelledby="titulo-para-atender" className="flex flex-col gap-4 pt-4">
          <h2 id="titulo-para-atender" className="text-titulo-2">
            Para atender
          </h2>
          <Link
            href="/directiva/incidentes?estado=porEvaluar"
            className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
          >
            <span className="flex items-center gap-2 font-bold">
              <MapPin aria-hidden className="size-icono text-accion-primaria" />
              Incidentes por evaluar
            </span>
            <span className="text-dato font-bold">{quejas.porEvaluar}</span>
            <span>{quejas.enRevision} en revisión</span>
            <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
              <Info aria-hidden className="size-icono-pequeno" />
              {quejas.porEvaluar === 0
                ? "Nada pendiente"
                : quejas.porEvaluar === 1
                  ? "1 reporte nuevo"
                  : `${quejas.porEvaluar} reportes nuevos`}
            </span>
          </Link>
          <Link
            href="/directiva/alertas"
            className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
          >
            <Bell aria-hidden className="size-icono" />
            Ver todas las alertas de la directiva
            <ChevronRight aria-hidden className="size-icono" />
          </Link>
        </section>
      )}
      <div className="pt-4">
        <BotonEnlace href="/directiva/comunicados/nuevo" variante="secundario" icono={Megaphone}>
          Publicar un comunicado
        </BotonEnlace>
      </div>
      <div>
        <BotonEnlace href="/directiva/actas/nueva" variante="secundario" icono={FileText}>
          Publicar un acta
        </BotonEnlace>
      </div>
      <div>
        <BotonEnlace href="/directiva/balances/nuevo" variante="secundario" icono={Landmark}>
          Publicar un balance
        </BotonEnlace>
      </div>
    </div>
  );
}
