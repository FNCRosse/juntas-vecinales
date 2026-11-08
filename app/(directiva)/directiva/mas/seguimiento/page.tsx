import { Bell, History, LifeBuoy, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { solicitudesPorAtender } from "@/modulos/accesibilidad/aplicacion/mediacion";
import { Categoria } from "../_componentes/Categoria";

export const metadata: Metadata = { title: "Seguimiento" };

// DIR-INI-04 · Más · Seguimiento (prototipo DMA05).
export default async function Seguimiento() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const pedidos = await solicitudesPorAtender({
    usuarioId: sesion.usuarioId,
    nombre: sesion.nombreCompleto,
    roles: sesion.roles,
  });
  const pendientes = pedidos.filter((p) => p.estado !== "ATENDIDA").length;
  return (
    <Categoria
      titulo="Seguimiento"
      destinos={[
        { href: "/directiva/alertas", titulo: "Alertas de la directiva", icono: Bell },
        {
          href: "/directiva/pedidos-de-ayuda",
          titulo: "Pedidos de ayuda",
          icono: LifeBuoy,
          detalle: pendientes ? `${pendientes} por atender` : "No hay pedidos por atender",
        },
        { href: "/directiva/historial", titulo: "Historial de acciones", icono: History },
        { href: "/directiva/incidentes", titulo: "Incidentes", icono: MapPin },
      ]}
    />
  );
}
