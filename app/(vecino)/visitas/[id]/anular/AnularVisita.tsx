"use client";
// @HU-GAR-05

import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

export function AnularVisita({ id, nombre, cuando }: { id: string; nombre: string; cuando: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  async function anular() {
    setEnviando(true);
    const r = await enviarJson(`/api/garita/visitas/${id}`, "DELETE");
    if (r.ok) return router.push(`/visitas?${new URLSearchParams({ anulada: nombre })}`);
    setEnviando(false);
    setFalla(r.error);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">¿Desea anular la visita de {nombre}?</h1>
      <section className="flex flex-col gap-1 rounded-control bg-fondo-suave p-4 senior:p-6">
        <strong>{nombre}</strong>
        <span>{cuando}</span>
      </section>
      <p>
        Si la anula, el vigilante ya no la verá en la lista. Si igual llega, le preguntarán a usted antes de
        dejarla pasar.
      </p>
      {falla && (
        <MensajeEstado tipo="error" titulo="No se anuló la visita">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <div className="flex flex-col gap-separacion">
        <BotonEnlace href="/visitas" variante="secundario">
          No, mantener la visita
        </BotonEnlace>
        <Boton variante="peligro" icono={TriangleAlert} cargando={enviando} onClick={anular}>
          Sí, anular la visita
        </Boton>
      </div>
    </div>
  );
}
