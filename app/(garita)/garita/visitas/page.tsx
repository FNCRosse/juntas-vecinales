import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { visitasDeHoy } from "@/modulos/identidad/aplicacion/garita";
import { RefrescarSolo } from "../_componentes/RefrescarSolo";
import { BuscarVisita } from "./_componentes/BuscarVisita";
import { EnlaceLlego } from "./_componentes/EnlaceLlego";

export const metadata: Metadata = { title: "Llegó una visita" };

// VIG-VIS-01 Llegó una visita: primero se busca en la lista blanca (HU-GAR-07 CA1); si no está, se
// pregunta a la casa (CA2).
export default async function LlegoUnaVisita() {
  const sesion = await exigirActor(["VIGILANTE"], "/entrar/equipo");
  const { anunciadas } = await visitasDeHoy(sesion);
  return (
    <div className="flex flex-col gap-6">
      <RefrescarSolo segundos={60} />
      <Link
        href="/garita"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al inicio
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Llegó una visita</h1>
        <p>Primero busque en la lista de visitas anunciadas. Si está, no hace falta pedirle sus datos.</p>
      </div>
      <BuscarVisita />
      <Tarjeta titulo="Visitas anunciadas">
        {anunciadas.length ? (
          <ul className="flex flex-col gap-4">
            {anunciadas.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 border-b border-borde-sutil pb-4 last:border-b-0">
                <strong>{a.nombre}</strong>
                <span>Para {a.vivienda}</span>
                <span className="text-texto-secundario">
                  {a.cuando} · {a.vehiculo}
                </span>
                <EnlaceLlego id={a.id} nombre={a.nombre} />
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay visitas anunciadas para hoy.</p>
        )}
      </Tarjeta>
    </div>
  );
}
