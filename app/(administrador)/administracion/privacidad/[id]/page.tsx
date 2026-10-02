import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { VERIFICACIONES, verSolicitudArco } from "@/modulos/identidad/aplicacion/arco";
import { ResolverSolicitud } from "./ResolverSolicitud";

export const metadata: Metadata = { title: "Resolver una solicitud de privacidad" };

// ADM-ARC-02 y ADM-ARC-03 (XCF07): resolver una rectificación en dos pasos (HU-GAR-13 CA3, HU-GAR-16 CA3);
// el cambio de número pide antes la verificación de identidad (HU-GAR-17 CA2).
export default async function Resolver({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const solicitud = await verSolicitudArco(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  return <ResolverSolicitud solicitud={solicitud} verificaciones={VERIFICACIONES} />;
}
