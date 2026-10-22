import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { motivosDeObservacion, verComprobante } from "@/modulos/aportes/aplicacion/pagos";
import { ObservarPago } from "./ObservarPago";

export const metadata: Metadata = { title: "Observar un comprobante" };

// DIR-COB-05 y DIR-COB-06 (HU-COB-10): marcar el comprobante como observado con un motivo. Solo la directiva y nunca el
// pago de su propia casa: quien no puede decidir vuelve a la revisión del comprobante, que le explica por qué.
export default async function ObservarComprobante({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const c = await verComprobante(sesion, (await params).id);
  if (!c.puedeAprobar) redirect(`/directiva/cobros/comprobantes/${c.id}`);
  return (
    <ObservarPago comprobanteId={c.id} nombre={c.nombre} monto={c.monto} motivos={motivosDeObservacion} />
  );
}
