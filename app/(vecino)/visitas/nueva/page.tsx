import { ArrowLeft, HandCoins } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { misVisitas } from "@/modulos/identidad/aplicacion/visitas";
import { RegistrarVisita } from "./RegistrarVisita";

export const metadata: Metadata = { title: "Registrar una visita" };

// VEC-GAR-02 y 03 (HU-GAR-04 CA1 y CA3); VEC-GAR-06 si tiene 8 semanas pendientes (CA2).
export default async function Nueva() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const { vivienda, puedeRegistrar } = await misVisitas(sesion);
  if (!puedeRegistrar) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/visitas"
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <ArrowLeft aria-hidden className="size-icono" />
          Volver a Mis visitas
        </Link>
        <h1 className="text-titulo-1">Por ahora no puede registrar visitas nuevas</h1>
        <MensajeEstado tipo="aviso" titulo="Tiene 8 semanas pendientes">
          <p>
            Así lo acordó la asamblea. Sus visitas igual pueden entrar: el vigilante le preguntará a usted
            cuando lleguen.
          </p>
        </MensajeEstado>
        <p>Cuando se ponga al día, podrá volver a registrar visitas desde aquí.</p>
        <BotonEnlace href="/mas/ayuda?desde=/visitas" variante="secundario" icono={HandCoins}>
          Hablar con la directiva
        </BotonEnlace>
      </div>
    );
  }
  return <RegistrarVisita vivienda={vivienda} nombre={sesion.nombreCompleto} />;
}
