import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { datosParaPagar } from "@/modulos/aportes/aplicacion/pagos";
import { PagarCuota } from "./PagarCuota";

export const metadata: Metadata = { title: "Pagar mi cuota" };

// VEC-COB-02 a VEC-COB-04 (HU-COB-08): pagar la cuota con la foto del comprobante. El pago en efectivo con la
// directiva en casa llega con HU-COB-11. Sin semanas por pagar (o con todo ya en revisión) no hay nada que mostrar.
export default async function Pagar() {
  const sesion = await exigirActor(
    ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    "/entrar",
  );
  const datos = await datosParaPagar(sesion);
  if (datos.opciones.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/cuota"
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <ChevronLeft aria-hidden className="size-icono" />
          Volver a Mi cuota
        </Link>
        <h1 className="text-titulo-1">Pagar mi cuota</h1>
        <MensajeEstado tipo="info" titulo="No hay nada por pagar ahora">
          <p>Está al día, o su pago ya está en revisión. Lo verá en Mi cuota.</p>
        </MensajeEstado>
      </div>
    );
  }
  return (
    <PagarCuota
      vivienda={datos.vivienda}
      opciones={datos.opciones}
      medios={datos.medios}
      datosDePago={datos.datosDePago}
    />
  );
}
