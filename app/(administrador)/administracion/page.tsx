import {
  ChevronRight,
  CircleCheck,
  DoorOpen,
  Info,
  Inbox,
  ScrollText,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaLarga, horaCorta, primerNombre, saludo } from "@/compartido/fechas";
import { Cifra } from "@/componentes/a11y/Cifra";
import { Insignia } from "@/componentes/a11y/Insignia";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { resumenArco } from "@/modulos/identidad/aplicacion/arco";
import { auditoriaGlobal } from "@/modulos/identidad/aplicacion/auditoria";
import { instantanea } from "@/modulos/identidad/aplicacion/garita";

export const metadata: Metadata = { title: "Panel de administración" };

const ENLACE = "inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace";

// ADM-INI-01 Panel de administración (prototipo XIN01): lo que espera, con la alerta de las solicitudes de
// privacidad que vencen pronto (HU-GAR-16 CA2); cómo está la lista de la garita; y las últimas acciones de la
// auditoría global (HU-GAR-26), con un enlace para verla completa.
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
      <div className="flex flex-col gap-1">
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
      <section aria-labelledby="titulo-para-atender" className="flex flex-col gap-3">
        <h2 id="titulo-para-atender" className="flex items-center gap-2 text-titulo-3">
          <Inbox aria-hidden className="size-icono shrink-0 text-accion-primaria" />
          Para atender
        </h2>
        <Link
          href="/administracion/privacidad"
          className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte active:bg-fondo-suave senior:p-6"
        >
          <span className="flex items-center gap-2 font-bold">
            <ShieldCheck aria-hidden className="size-icono shrink-0 text-accion-primaria" />
            Solicitudes de privacidad
          </span>
          {pendientes === 0 ? (
            <Insignia tono="exito" icono={CircleCheck}>
              No hay solicitudes por resolver
            </Insignia>
          ) : (
            <Insignia tono="info" icono={Info}>
              {pendientes === 1 ? "1 solicitud por resolver" : `${pendientes} solicitudes por resolver`}
            </Insignia>
          )}
        </Link>
      </section>
      <div className="flex flex-col gap-6 md:grid md:grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] md:items-start">
        <Tarjeta titulo="Lista de la garita" icono={DoorOpen}>
          <div className="grid grid-cols-2 gap-separacion">
            <Cifra titulo="Al día" valor={casas(alDia)} />
            <Cifra titulo="Atrasados" valor={casas(atrasados)} />
          </div>
          <p className="flex items-start gap-2">
            <CircleCheck aria-hidden className="size-icono shrink-0 text-texto-exito" />
            Última sincronización: hoy a las {horaCorta(new Date(garita.generadaEn))}
          </p>
          {atrasados > 0 && (
            <p className="flex items-start gap-2 text-pequeno text-texto-secundario">
              <TriangleAlert aria-hidden className="size-icono-pequeno shrink-0" />A los atrasados el
              vigilante no les abre la reja.
            </p>
          )}
        </Tarjeta>
        <Tarjeta titulo="Últimas acciones" icono={ScrollText}>
          <div className="flex flex-col">
            {auditoria.filas.slice(0, 3).map((f) => (
              <article key={f.id} className="flex flex-col gap-1 border-b border-borde-sutil py-3">
                <span className="text-pequeno text-texto-secundario">
                  {f.fecha} · {f.responsable}
                </span>
                <span>{f.texto}</span>
              </article>
            ))}
          </div>
          <Link href="/administracion/auditoria" className={ENLACE}>
            Ver toda la auditoría
            <ChevronRight aria-hidden className="size-icono shrink-0" />
          </Link>
        </Tarjeta>
      </div>
    </div>
  );
}
