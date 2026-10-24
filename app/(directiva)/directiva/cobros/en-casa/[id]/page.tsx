import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { verPedidoDeCobro } from "@/modulos/aportes/aplicacion/cobros";
import { CobrarEnCasa } from "./CobrarEnCasa";

export const metadata: Metadata = { title: "Cobrar en casa" };

// DIR-COB-08 y DIR-COB-09 (HU-COB-11): cobrar en efectivo en la casa de quien lo pidió. Cobrar es solo de la directiva y
// nunca en su propia casa: el mediador y quien cobra a su casa ven por qué no pueden. Cargar la página pide señal; registrar
// el cobro, no.
export default async function CobrarEnCasaPagina({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const pedido = await verPedidoDeCobro(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  if (!pedido.puedeCobrar) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/directiva/cobros"
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <ChevronLeft aria-hidden className="size-icono" />
          Volver a cobros en casa
        </Link>
        <h1 className="text-titulo-1">Cobrar en casa de {pedido.nombre}</h1>
        <MensajeEstado tipo="info" titulo="No puede registrar este cobro">
          <p>
            {!pedido.pendiente
              ? "Este pedido ya se cobró o se canceló."
              : pedido.esSuyo
                ? "Es el cobro de su casa: lo registra otro miembro de la directiva."
                : "Solo la directiva registra los cobros en efectivo."}
          </p>
        </MensajeEstado>
      </div>
    );
  }
  return <CobrarEnCasa pedido={pedido} />;
}
