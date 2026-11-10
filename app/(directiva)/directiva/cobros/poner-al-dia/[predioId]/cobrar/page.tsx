import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verCasaParaCobrar } from "@/modulos/aportes/aplicacion/cobros";
import { CobrarEnEfectivo } from "./CobrarEnEfectivo";

export const metadata: Metadata = { title: "Cobrar en efectivo" };

// DIR-19 (HU-COB-11): desde la ficha del vecino, cobrarle en efectivo las semanas que pueda pagar aunque no haya pedido
// el cobro en casa; la directiva hace de intermediaria. La directiva o el mediador (MED-13), nunca en su propia casa.
export default async function CobrarEnEfectivoPagina({ params }: { params: Promise<{ predioId: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const casa = await verCasaParaCobrar(sesion, (await params).predioId).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  if (!casa.puedeCobrar) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/directiva/cobros/poner-al-dia"
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <ChevronLeft aria-hidden className="size-icono" />
          Volver a la ficha
        </Link>
        <h1 className="text-titulo-1">Cobrar en efectivo a {casa.nombre}</h1>
        <MensajeEstado tipo="info" titulo="No puede registrar este cobro">
          <p>
            {casa.esSuya
              ? "Es el cobro de su casa: lo registra otro miembro de la directiva."
              : "Esta casa no tiene semanas por cobrar. Lo que debía ya está pagado o en revisión."}
          </p>
        </MensajeEstado>
      </div>
    );
  }
  return <CobrarEnEfectivo casa={casa} />;
}
