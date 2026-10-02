import { Car, ChevronRight, Clock, ListChecks, NotebookPen, Search, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaLarga } from "@/compartido/fechas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { Tarjeta, TarjetaEnlace } from "@/componentes/a11y/Tarjeta";
import { bitacora, visitasDeHoy } from "@/modulos/identidad/aplicacion/garita";
import { EnlaceLlego } from "./visitas/_componentes/EnlaceLlego";
import { RefrescarSolo } from "./_componentes/RefrescarSolo";

export const metadata: Metadata = { title: "Garita principal" };

const ACCIONES = [
  {
    href: "/garita/consultar",
    Icono: Search,
    titulo: "Consultar vecino o placa",
    texto: "Para saber si puede abrirle la reja",
  },
  {
    href: "/garita/visitas",
    Icono: UserRound,
    titulo: "Llegó una visita",
    texto: "Buscar en la lista o preguntar al vecino",
  },
  { href: "/garita/bitacora", Icono: NotebookPen, titulo: "Bitácora", texto: "Entradas y salidas de hoy" },
];

// VIG-INI-01 Inicio de la garita: acciones, respuestas de los vecinos, visitas anunciadas (HU-GAR-07)
// y quién sigue dentro con la alerta de permanencia (HU-GAR-08 CA2).
export default async function InicioGarita() {
  const sesion = await exigirActor(["VIGILANTE"], "/entrar/equipo");
  const [{ anunciadas, preguntas }, { dentro }] = await Promise.all([visitasDeHoy(sesion), bitacora(sesion)]);
  const respondidas = preguntas.filter((p) => p.estado !== "ESPERANDO_RESPUESTA");
  const largas = dentro.filter((f) => f.alerta);

  return (
    <div className="flex flex-col gap-8">
      <RefrescarSolo segundos={30} />
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Garita principal</h1>
        <p className="text-texto-secundario">{fechaLarga(new Date())}</p>
      </div>

      {respondidas.map((p) => (
        <MensajeEstado
          key={p.id}
          tipo={p.estado === "AUTORIZADA" ? "exito" : "aviso"}
          titulo={
            p.estado === "AUTORIZADA"
              ? `${p.vivienda} respondió: ${p.nombre} puede pasar`
              : `${p.vivienda} respondió: no puede recibir a ${p.nombre}`
          }
        >
          <Link
            href={`/garita/visitas/${p.id}`}
            className="inline-flex min-h-tactil items-center gap-2 font-bold text-texto-enlace"
          >
            Ver la visita de {p.nombre}
            <ChevronRight aria-hidden className="size-icono" />
          </Link>
        </MensajeEstado>
      ))}

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ACCIONES.map(({ href, Icono, titulo, texto }) => (
          <li key={href} className="flex">
            <TarjetaEnlace href={href} titulo={titulo}>
              <Icono aria-hidden className="size-icono text-accion-primaria" />
              <span className="text-texto-secundario">{texto}</span>
            </TarjetaEnlace>
          </li>
        ))}
      </ul>

      <Tarjeta titulo="Visitas anunciadas">
        <p className="inline-flex items-center gap-2 text-texto-secundario">
          <ListChecks aria-hidden className="size-icono shrink-0" />
          Las anotan los vecinos en su app. Se actualizan solas.
        </p>
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
          <p>No hay visitas anunciadas.</p>
        )}
      </Tarjeta>

      <Tarjeta titulo="Dentro del barrio ahora">
        <p className="inline-flex items-center gap-2">
          <Car aria-hidden className="size-icono shrink-0" />
          <span>
            <strong>
              {dentro.length === 1 ? "1 vehículo o visita" : `${dentro.length} vehículos o visitas`}
            </strong>{" "}
            entraron y todavía no salen.
          </span>
        </p>
        {largas.map((f) => (
          <MensajeEstado key={f.id} tipo="aviso" titulo={`${f.placa ?? f.quien} lleva más de 6 horas`}>
            <p>
              {f.quien}, a {f.vivienda}. Entró a las {f.hora}. Revise la bitácora.
            </p>
          </MensajeEstado>
        ))}
        <Link
          href="/garita/bitacora"
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <Clock aria-hidden className="size-icono" />
          Ver la bitácora
          <ChevronRight aria-hidden className="size-icono" />
        </Link>
      </Tarjeta>

      <BotonCerrarSesion destino="/entrar/equipo" />
    </div>
  );
}
