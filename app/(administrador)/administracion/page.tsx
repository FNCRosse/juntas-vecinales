import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaLarga, horaCorta, primerNombre, saludo } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";
import { resumenArco } from "@/modulos/identidad/aplicacion/arco";
import { auditoriaGlobal } from "@/modulos/identidad/aplicacion/auditoria";
import { instantanea } from "@/modulos/identidad/aplicacion/garita";

export const metadata: Metadata = { title: "Panel de administración" };

// ADM-INI-01 Panel de administración (prototipo XIN01): lo que espera, con la alerta de las solicitudes de
// privacidad que vencen pronto (HU-GAR-16 CA2); cómo está la lista de la garita; y las últimas acciones de la
// auditoría global (HU-GAR-26), con un botón para verla completa.
export default async function PanelAdministracion() {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const ahora = new Date();
  const [{ pendientes, porVencer }, garita, auditoria] = await Promise.all([
    resumenArco(sesion, ahora),
    instantanea(sesion, ahora),
    auditoriaGlobal(sesion),
  ]);
  const alDia = garita.casas.filter((c) => c.estado === "VERDE").length;
  const atrasados = garita.casas.length - alDia;
  const casas = (n: number) => (n === 1 ? "1 casa" : `${n} casas`);
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
          <p>Resuélvala antes de que venza el plazo legal.</p>
        </MensajeEstado>
      )}
      <section aria-labelledby="titulo-para-atender" className="flex flex-col gap-4">
        <h2 id="titulo-para-atender" className="text-titulo-2">
          Para atender
        </h2>
        <TarjetaEnlace href="/administracion/privacidad" titulo="Solicitudes de privacidad">
          <span>
            {pendientes === 0
              ? "No hay solicitudes por resolver."
              : pendientes === 1
                ? "1 solicitud por resolver."
                : `${pendientes} solicitudes por resolver.`}
          </span>
        </TarjetaEnlace>
      </section>
      <section aria-labelledby="titulo-garita" className="flex flex-col gap-3">
        <h2 id="titulo-garita" className="text-titulo-2">
          Lista de la garita
        </h2>
        <dl className="grid grid-cols-2 gap-separacion">
          <div className="flex flex-col rounded-control bg-fondo-suave p-4 senior:p-6">
            <dt className="text-pequeno text-texto-secundario">Al día</dt>
            <dd className="text-titulo-3 font-bold">{casas(alDia)}</dd>
          </div>
          <div className="flex flex-col rounded-control bg-fondo-suave p-4 senior:p-6">
            <dt className="text-pequeno text-texto-secundario">Atrasados</dt>
            <dd className="text-titulo-3 font-bold">{casas(atrasados)}</dd>
          </div>
        </dl>
        <p className="text-pequeno text-texto-secundario">
          Última sincronización: hoy a las {horaCorta(new Date(garita.generadaEn))}.
        </p>
      </section>
      <section aria-labelledby="titulo-ultimas" className="flex flex-col gap-3">
        <h2 id="titulo-ultimas" className="text-titulo-2">
          Últimas acciones
        </h2>
        {auditoria.filas.slice(0, 3).map((f) => (
          <article key={f.id} className="flex flex-col gap-1 border-b border-borde-sutil pb-3">
            <span className="text-pequeno text-texto-secundario">
              {f.fecha} · {f.responsable}
            </span>
            <span>{f.texto}</span>
          </article>
        ))}
        <BotonEnlace href="/administracion/auditoria" variante="secundario" icono={ChevronRight}>
          Ver toda la auditoría
        </BotonEnlace>
      </section>
    </div>
  );
}
