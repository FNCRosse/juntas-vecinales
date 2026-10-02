import { CircleCheck, Clock, Phone } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { solicitudesPorAtender } from "@/modulos/accesibilidad/aplicacion/mediacion";
import { CambiarEstado } from "./CambiarEstado";

export const metadata: Metadata = { title: "Pedidos de ayuda" };

// DIR-AYU-01 Pedidos de ayuda (HU-ACC-04 CA2 y CA3): quién, en qué pantalla se quedó y cómo
// prefiere que le ayuden; primero lo pendiente.
export default async function PedidosDeAyuda() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const pedidos = await solicitudesPorAtender({
    usuarioId: sesion.usuarioId,
    nombre: sesion.nombreCompleto,
    roles: sesion.roles,
  });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Mediación</p>
        <h1 className="text-titulo-1">Pedidos de ayuda</h1>
        <p>
          Vecinos que no pudieron terminar algo en la app. Se ve en qué pantalla se quedaron para saber qué
          explicarles.
        </p>
      </div>
      {pedidos.length ? (
        <ul className="flex flex-col gap-separacion" aria-label="Pedidos de ayuda">
          {pedidos.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta"
            >
              <span className="text-pequeno text-texto-secundario">
                N.° {p.numero} · {fechaYHora(new Date(p.fecha))}
              </span>
              <strong className="text-titulo-3">{p.quien}</strong>
              <span>
                Se quedó en: <strong>{p.pantalla}</strong>
              </span>
              <span>Prefiere: {p.modo.toLowerCase()}</span>
              {p.detalle && <p className="rounded-control bg-fondo-suave p-3">«{p.detalle}»</p>}
              <span
                className={`inline-flex items-center gap-2 font-bold ${p.estado === "ATENDIDA" ? "text-texto-exito" : "text-texto-aviso"}`}
              >
                {p.estado === "ATENDIDA" ? (
                  <CircleCheck aria-hidden className="size-icono-pequeno" />
                ) : (
                  <Clock aria-hidden className="size-icono-pequeno" />
                )}
                {p.estadoTexto}
              </span>
              {p.estado !== "ATENDIDA" && <CambiarEstado id={p.id} estado={p.estado} quien={p.quien} />}
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="inline-flex items-center gap-2">
          <Phone aria-hidden className="size-icono" />
          No hay pedidos de ayuda por ahora.
        </p>
      )}
    </div>
  );
}
