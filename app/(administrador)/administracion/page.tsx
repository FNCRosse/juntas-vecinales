import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaLarga, primerNombre, saludo } from "@/compartido/fechas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";
import { resumenArco } from "@/modulos/identidad/aplicacion/arco";

export const metadata: Metadata = { title: "Panel de administración" };

// ADM-INI-01 Panel de administración: las solicitudes de privacidad que esperan, con la alerta de las
// que vencen pronto (HU-GAR-16 CA2).
export default async function PanelAdministracion() {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const ahora = new Date();
  const { pendientes, porVencer } = await resumenArco(sesion, ahora);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">
          {saludo(ahora)}, {primerNombre(sesion.nombreCompleto)}
        </h1>
        <p className="text-texto-secundario">{fechaLarga(ahora)} · Administración</p>
      </div>
      {porVencer > 0 && (
        <MensajeEstado
          tipo="aviso"
          titulo={
            porVencer === 1
              ? "Una solicitud de privacidad vence pronto"
              : `${porVencer} solicitudes de privacidad vencen pronto`
          }
        >
          <p>Le quedan 2 días hábiles o menos. Resuélvalas antes de que venza el plazo legal.</p>
        </MensajeEstado>
      )}
      <TarjetaEnlace href="/administracion/privacidad" titulo="Solicitudes de privacidad">
        <span>
          {pendientes === 0
            ? "No hay solicitudes por resolver."
            : pendientes === 1
              ? "1 solicitud por resolver."
              : `${pendientes} solicitudes por resolver.`}
        </span>
      </TarjetaEnlace>
    </div>
  );
}
