import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { pagoParaOtraFoto } from "@/modulos/aportes/aplicacion/pagos";
import { EnviarOtraFoto } from "./EnviarOtraFoto";

export const metadata: Metadata = { title: "Enviar otra foto de su pago" };

// VEC-COB-07 (HU-COB-10 CA3): la casa manda otra foto de un pago observado. Solo de un pago de su casa (404 si es de
// otra); si el pago ya no está observado, vuelve a Mis pagos.
export default async function OtraFoto({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(
    ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    "/entrar",
  );
  const pago = await pagoParaOtraFoto(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  if (!pago.puedeEnviar) redirect("/cuota/pagos");
  return <EnviarOtraFoto {...pago} />;
}
