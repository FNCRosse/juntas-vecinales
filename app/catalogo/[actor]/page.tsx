import { notFound } from "next/navigation";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import type { Actor } from "@/componentes/a11y/BarraNavegacion";
import { MarcoActor } from "@/componentes/a11y/MarcoActor";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";

// El marco de cada actor (barra superior y navegación) tal como lo pintan los layouts de los
// grupos de rutas, que todavía no tienen pantallas (llegan con M1).
const MARCOS: Record<string, { actor?: Actor; titulo: string }> = {
  directiva: { actor: "directiva", titulo: "Marco de la directiva" },
  administrador: { actor: "administrador", titulo: "Marco del administrador" },
  garita: { actor: "garita", titulo: "Marco de la garita" },
  acceso: { titulo: "Marco de las pantallas de acceso" },
};

export default async function MarcoDeActor({ params }: { params: Promise<{ actor: string }> }) {
  const marco = MARCOS[(await params).actor];
  if (!marco) notFound();
  return (
    <MarcoActor actor={marco.actor} modoSenior={await modoSeniorAlRenderizar()}>
      <div className="flex flex-col gap-8">
        <h1 className="text-titulo-1">{marco.titulo}</h1>
        <Tarjeta titulo="Contenido de ejemplo">
          <p>Aquí irá el contenido de cada pantalla, debajo de la barra superior.</p>
        </Tarjeta>
      </div>
    </MarcoActor>
  );
}
