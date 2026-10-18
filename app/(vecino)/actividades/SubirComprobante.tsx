"use client";
// @HU-ASA-08

import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// Sube la foto del comprobante de Yape o Plin de un aporte anticipado (HU-ASA-08 CA2): pide la URL firmada, sube
// la foto directo a R2 y se la enlaza al aporte. La directiva la revisa después.
export function SubirComprobante({
  actividadId,
  tieneComprobante,
}: {
  actividadId: string;
  tieneComprobante: boolean;
}) {
  const router = useRouter();
  const [subiendo, setSubiendo] = useState(false);
  const [falla, setFalla] = useState<string | undefined>();
  const [nombre, setNombre] = useState("");

  async function subir(archivo: File) {
    setSubiendo(true);
    setFalla(undefined);
    const pedido = await enviarJson<{
      id: string;
      url: string;
      metodo: string;
      cabeceras: Record<string, string>;
    }>("/api/archivos", "POST", { uso: "comprobante_aporte", tipo: archivo.type, tamano: archivo.size });
    if (!pedido.ok) {
      setSubiendo(false);
      return setFalla(pedido.campos.archivo ?? pedido.error);
    }
    try {
      const subida = await fetch(pedido.datos.url, {
        method: pedido.datos.metodo,
        headers: pedido.datos.cabeceras,
        body: archivo,
      });
      if (!subida.ok) throw new Error("subida");
    } catch {
      setSubiendo(false);
      return setFalla("No pudimos subir la foto. Revise su internet y vuelva a elegirla.");
    }
    const adjunto = await enviarJson(`/api/eventos/${actividadId}/colaboraciones/comprobante`, "POST", {
      archivoId: pedido.datos.id,
    });
    setSubiendo(false);
    if (!adjunto.ok) return setFalla(adjunto.campos.archivoId ?? adjunto.error);
    setNombre(archivo.name);
    router.refresh();
  }

  if (tieneComprobante) {
    return (
      <MensajeEstado tipo="exito" titulo="Recibimos su comprobante">
        <p>La directiva lo revisará.{nombre ? ` Foto: ${nombre}.` : ""}</p>
      </MensajeEstado>
    );
  }
  return (
    <Campo
      type="file"
      name="comprobante"
      etiqueta="Foto del comprobante de Yape o Plin"
      accept="image/jpeg,image/png,application/pdf"
      ayuda={subiendo ? "Subiendo la foto…" : "Elija la captura de su pago. Aceptamos fotos y PDF."}
      error={falla}
      disabled={subiendo}
      onChange={(e) => {
        const archivo = e.target.files?.[0];
        if (archivo) void subir(archivo);
      }}
    />
  );
}
