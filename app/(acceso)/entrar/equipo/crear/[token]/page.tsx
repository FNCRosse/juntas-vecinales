import type { Metadata } from "next";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { consultarInvitacion } from "@/modulos/identidad/aplicacion/equipo";
import { FormularioAccesoEquipo } from "./FormularioAccesoEquipo";

export const metadata: Metadata = { title: "Crear su acceso de equipo", referrer: "no-referrer" };

// ADM-ENT-02 Crear el acceso de equipo con la invitación (HU-GAR-21 CA2). Abrir la página no la gasta.
export default async function CrearAccesoEquipo({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitacion = await consultarInvitacion(token);
  if (!invitacion) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-titulo-1">Esta invitación ya no sirve</h1>
        <MensajeEstado tipo="aviso" titulo="Pida una invitación nueva">
          <p>Cada invitación sirve una sola vez y por 48 horas. Pida otra a la administración de la junta.</p>
        </MensajeEstado>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Crear su acceso de equipo</h1>
        <p>
          {invitacion.nombre}, la junta le dio acceso como <strong>{invitacion.rolTexto}</strong>. Es distinto
          del enlace de vecinos: con él entra a las funciones de su rol.
        </p>
      </div>
      <FormularioAccesoEquipo token={token} dni={invitacion.dni} />
    </div>
  );
}
