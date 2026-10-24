import { ChevronLeft, MessageCircle, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { soles } from "@/compartido/dinero";
import { miReja } from "@/modulos/aportes/aplicacion/morosidad";

export const metadata: Metadata = { title: "La reja no se abre sola" };

// VEC-COB-12 (HU-COB-06 CA2 y CA3): lo que pasa con la reja a las 8 semanas pendientes, sin culpa y sin la palabra «moroso»,
// y cómo volver a la normalidad. Solo ve su casa. Si la reja se abre sola, no hay nada que explicar.
export default async function Reja() {
  const sesion = await exigirActor(
    ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    "/entrar",
  );
  const reja = await miReja(sesion);
  if (!reja?.suspendida) redirect("/cuota");
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al inicio
      </Link>
      <h1 className="text-titulo-1">Por ahora la reja no se abre sola</h1>
      <section aria-label="Lo que tiene pendiente" className="flex flex-col gap-1">
        <p className="text-titulo-2">Tiene {reja.semanas} semanas pendientes</p>
        <p className="text-titulo-2">{soles(reja.debe)}</p>
        <p className="text-texto-secundario">{reja.detalle}</p>
      </section>
      <section aria-labelledby="titulo-significa" className="flex flex-col gap-2">
        <h2 id="titulo-significa" className="text-titulo-2">
          Qué significa
        </h2>
        <p>
          La asamblea acordó que, desde las {reja.umbral} semanas pendientes, el vigilante no abre la reja
          automáticamente. Usted puede entrar abriéndola a mano, como siempre. Por ahora tampoco puede
          registrar visitas nuevas.
        </p>
      </section>
      <section aria-labelledby="titulo-normalidad" className="flex flex-col gap-2">
        <h2 id="titulo-normalidad" className="text-titulo-2">
          Cómo volver a la normalidad
        </h2>
        <p>
          Pague lo pendiente por la app o en efectivo con la directiva. Apenas la directiva lo valide, la reja
          vuelve a abrirse sola y le avisamos.
        </p>
        <p>¿No puede pagarlo todo junto? Converse con la directiva: pueden ayudarla a ponerse al día.</p>
      </section>
      <div className="flex flex-col gap-opuestas">
        <BotonEnlace href="/cuota/pagar" icono={Wallet}>
          Pagar mi cuota
        </BotonEnlace>
        <BotonEnlace href="/mas/ayuda?desde=/cuota/reja" variante="secundario" icono={MessageCircle}>
          Hablar con la directiva
        </BotonEnlace>
      </div>
    </div>
  );
}
