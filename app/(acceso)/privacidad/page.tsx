import type { Metadata } from "next";
import { TextoDePolitica } from "@/app/_privacidad/TextoDePolitica";
import { Volver } from "@/componentes/a11y/Volver";

export const metadata: Metadata = { title: "Política de privacidad" };

// Política de privacidad completa (Ley N.° 29733 y su reglamento; docs/DATOS.md §6): el texto está en TextoDePolitica.
// «Volver» regresa a «Antes de empezar» si se llegó desde ahí (VEC-07); si no, a la entrada.
export default async function PoliticaDePrivacidad({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string }>;
}) {
  const { desde } = await searchParams;
  const volver =
    desde === "entrar"
      ? { href: "/entrar/privacidad", texto: "Volver a «Antes de empezar»" }
      : { href: "/", texto: "Volver al inicio" };
  return (
    <div className="flex flex-col gap-6">
      <Volver href={volver.href}>{volver.texto}</Volver>
      <h1 className="text-titulo-1">Política de privacidad</h1>
      <p>Así cuida la junta los datos de cada vecino, según la Ley N.° 29733.</p>
      <TextoDePolitica />
    </div>
  );
}
