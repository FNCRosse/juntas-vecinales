import { CalendarDays, CirclePlus, HandHeart, Megaphone } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { Categoria } from "../_componentes/Categoria";

export const metadata: Metadata = { title: "Comunidad" };

// DIR-INI-04 · Más · Comunidad (prototipo DMA04).
export default async function Comunidad() {
  await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return (
    <Categoria
      titulo="Comunidad"
      destinos={[
        { href: "/directiva/asambleas", titulo: "Asambleas", icono: CalendarDays },
        { href: "/directiva/actividades", titulo: "Actividades pro-fondos", icono: HandHeart },
        { href: "/directiva/comunicados", titulo: "Comunicados a la comunidad", icono: Megaphone },
        {
          href: "/directiva/crear?desde=mas",
          titulo: "Crear asamblea, actividad o comunicado",
          icono: CirclePlus,
        },
      ]}
    />
  );
}
