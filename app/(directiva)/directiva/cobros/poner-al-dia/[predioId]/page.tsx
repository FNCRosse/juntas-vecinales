import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verCasaPorPonerAlDia } from "@/modulos/aportes/aplicacion/liquidaciones";
import { PonerAlDia } from "./PonerAlDia";

export const metadata: Metadata = { title: "Poner al día" };

// DIR-COB-16 y DIR-COB-17 (HU-COB-07): registrar el pago de toda la deuda de la casa, en dos pasos. Solo la directiva y nunca
// en su propia casa; el mediador y quien no tiene nada que pagar ven por qué no pueden.
export default async function PonerAlDiaCasa({ params }: { params: Promise<{ predioId: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const casa = await verCasaPorPonerAlDia(sesion, (await params).predioId).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  if (!casa.puedeRegistrar) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/directiva/cobros/poner-al-dia"
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <ChevronLeft aria-hidden className="size-icono" />
          Volver a la ficha
        </Link>
        <h1 className="text-titulo-1">Registrar el pago total de {casa.nombre}</h1>
        <MensajeEstado tipo="info" titulo="No puede registrar este pago">
          <p>
            {casa.esSuya
              ? "Es la deuda de su casa: la registra otro miembro de la directiva."
              : casa.debe === 0
                ? "Esta casa ya está al día: no debe nada."
                : "Solo la directiva registra los pagos."}
          </p>
        </MensajeEstado>
      </div>
    );
  }
  return <PonerAlDia casa={casa} />;
}
