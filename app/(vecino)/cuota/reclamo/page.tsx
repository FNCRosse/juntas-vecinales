import { ChevronLeft, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { datosParaReclamar } from "@/modulos/aportes/aplicacion/reclamos";
import { Reclamar } from "./Reclamar";

export const metadata: Metadata = { title: "Reclamo sobre mi cuota" };

const Volver = () => (
  <Link
    href="/cuota"
    className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
  >
    <ChevronLeft aria-hidden className="size-icono" />
    Volver a Mi cuota
  </Link>
);

// VEC-COB-08 a VEC-COB-10 y VEC-COB-11 (HU-COB-03): reclamar el monto de la cuota, en dos pasos. Si la casa ya tiene un reclamo en
// revisión, esta pantalla lo dice en lugar de dejar hacer otro (CA3).
export default async function ReclamoDeCuota() {
  const sesion = await exigirActor(
    ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    "/entrar",
  );
  const datos = await datosParaReclamar(sesion);
  if (datos.abierto) {
    return (
      <div className="flex flex-col gap-6">
        <Volver />
        <h1 className="text-titulo-1">Ya tiene un reclamo en revisión</h1>
        <p>
          Su reclamo N.° {datos.abierto.numero} del {datos.abierto.fecha.replace(/ de \d{4}$/, "")} sigue
          abierto. Para no mezclar respuestas, esperamos a que la directiva conteste. Luego podrá hacer otro
          si lo necesita.
        </p>
        <p>Si quiere agregar algo a su reclamo, una persona de la directiva puede ayudarla.</p>
        <BotonEnlace href={`/cuota/reclamo/${datos.abierto.id}`} icono={FileText}>
          Ver mi reclamo
        </BotonEnlace>
      </div>
    );
  }
  if (!datos.puedeReclamar) {
    return (
      <div className="flex flex-col gap-6">
        <Volver />
        <h1 className="text-titulo-1">Reclamo sobre mi cuota</h1>
        <MensajeEstado tipo="info" titulo="No tiene cuotas pendientes">
          <p>
            Solo se puede reclamar una cuota que todavía debe. Si algo no le cuadra, pida ayuda a la
            directiva.
          </p>
        </MensajeEstado>
      </div>
    );
  }
  return <Reclamar cuota={datos.cuota ?? ""} motivos={datos.motivos} />;
}
