import { ChevronLeft, FileDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { sesionActual } from "@/app/_sesion/sesion";
import { BotonEnlace, clasesBoton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { fechaEnFrase, fechaYHora } from "@/compartido/fechas";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { miDelegacion } from "@/modulos/asambleas/aplicacion/delegaciones";
import { predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { AnularDelegacion } from "./AnularDelegacion";
import { DelegarVoto } from "./DelegarVoto";

export const metadata: Metadata = { title: "Delegar mi voto" };

// VEC-ASA-03 a VEC-ASA-05 (HU-ASA-06): delegar el voto en dos pasos y, ya hecha, la delegación con su constancia.
export default async function Delegar() {
  const sesion = await sesionActual();
  const ahora = new Date();
  const asamblea = sesion ? await proximaAsamblea(sesion, ahora) : null;
  const predio = sesion ? await predioDelVecino(sesion.usuarioId) : null;
  if (!sesion || !asamblea) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-titulo-1">Delegar mi voto</h1>
        <p>No hay ninguna asamblea convocada por ahora.</p>
        <BotonEnlace href="/asambleas">Volver a Asambleas</BotonEnlace>
      </div>
    );
  }

  const delegacion = await miDelegacion(sesion, asamblea.id);
  const fecha = new Date(asamblea.fechaHora);
  const plazo = new Date(asamblea.confirmacionesHasta);
  const asambleaEnPalabras = fechaEnFrase(fecha);
  const titular = `${sesion.nombreCompleto}${predio ? `, ${predio.vivienda}` : ""}`;

  if (delegacion) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/asambleas"
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <ChevronLeft aria-hidden className="size-icono" />
          Volver a Asambleas
        </Link>
        <p className="text-texto-secundario">Registrada el {fechaYHora(new Date(delegacion.registradaEn))}</p>
        <MensajeEstado tipo="exito" titulo={`${delegacion.apoderadoNombre} votará por usted`}>
          <p>La mesa directiva ya tiene su constancia.</p>
        </MensajeEstado>
        <section aria-labelledby="titulo-constancia" className="flex flex-col gap-2">
          <h1 id="titulo-constancia" className="text-titulo-1">
            Constancia de delegación N.° {delegacion.numero}
          </h1>
          <p>Asamblea del {asambleaEnPalabras}</p>
          <p>Titular: {titular}</p>
          <p>
            Apoderado: {delegacion.apoderadoNombre}, {delegacion.condicionTexto}
          </p>
        </section>
        <div className="flex flex-col items-start gap-separacion">
          <a
            href={`/api/asambleas/${asamblea.id}/delegaciones/mia/constancia`}
            className={clasesBoton("primario")}
            target="_blank"
            rel="noopener"
          >
            <FileDown aria-hidden className="size-icono shrink-0" />
            <span>Descargar constancia (PDF)</span>
          </a>
          {ahora.getTime() <= plazo.getTime() && <AnularDelegacion asambleaId={asamblea.id} />}
        </div>
      </div>
    );
  }

  if (ahora.getTime() > plazo.getTime()) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-titulo-1">Delegar mi voto</h1>
        <p>El plazo para delegar el voto en esta asamblea ya cerró.</p>
        <BotonEnlace href="/asambleas">Volver a Asambleas</BotonEnlace>
      </div>
    );
  }

  return (
    <DelegarVoto
      asambleaId={asamblea.id}
      titular={titular}
      asambleaEnPalabras={asambleaEnPalabras}
      plazoEnPalabras={fechaEnFrase(plazo).replace(/ de \d{4}$/, "")}
    />
  );
}
