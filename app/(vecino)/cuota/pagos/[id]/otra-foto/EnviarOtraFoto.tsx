"use client";
// @HU-COB-10

import { ChevronLeft, Send, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

const MENSAJE_FOTO =
  "Falta la foto de su comprobante, o pesa más de 5 MB. Suba una captura de pantalla; si no puede, pida ayuda a una persona.";

// VEC-COB-07: la directiva observó el pago y la casa manda otra foto. Se sube al elegirla y se envía con un solo botón:
// el pago ya está guardado y volver a revisión no cuesta nada, así que no lleva segunda confirmación (R-12).
export function EnviarOtraFoto({
  id,
  resumen,
  titulo,
  texto,
}: {
  id: string;
  resumen: string;
  titulo: string;
  texto: string;
}) {
  const [archivo, setArchivo] = useState<{ id: string; nombre: string } | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function subir(foto: File) {
    setSubiendo(true);
    setError(undefined);
    setArchivo(null);
    const pedido = await enviarJson<{
      id: string;
      url: string;
      metodo: string;
      cabeceras: Record<string, string>;
    }>("/api/archivos", "POST", { uso: "comprobante_pago", tipo: foto.type, tamano: foto.size });
    if (!pedido.ok) {
      setSubiendo(false);
      return setError(MENSAJE_FOTO);
    }
    try {
      const subida = await fetch(pedido.datos.url, {
        method: pedido.datos.metodo,
        headers: pedido.datos.cabeceras,
        body: foto,
      });
      if (!subida.ok) throw new Error("subida");
      setArchivo({ id: pedido.datos.id, nombre: foto.name });
    } catch {
      setError("No pudimos subir la foto. Revise su internet y vuelva a elegirla.");
    }
    setSubiendo(false);
  }

  async function enviar() {
    if (!archivo) return setError(MENSAJE_FOTO);
    setEnviando(true);
    const r = await enviarJson(`/api/aportes/pagos/${id}/otra-foto`, "POST", { archivoId: archivo.id });
    setEnviando(false);
    if (r.ok) return setEnviado(true);
    setError(r.estado === 400 ? (r.campos.archivoId ?? r.error) : r.error);
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Foto enviada">
          <p>Avisamos a la directiva. Su pago vuelve a estar en revisión.</p>
        </MensajeEstado>
        <BotonEnlace href="/cuota/pagos" icono={Wallet}>
          Volver a Mis pagos
        </BotonEnlace>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
      className="flex flex-col gap-6"
    >
      <Link
        href="/cuota/pagos"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Mis pagos
      </Link>
      <h1 className="text-titulo-1">Enviar otra foto de su pago</h1>
      <MensajeEstado tipo="aviso" titulo={titulo}>
        <p>
          {resumen} {texto}
        </p>
      </MensajeEstado>
      <Campo
        type="file"
        name="archivoId"
        etiqueta="Foto nueva del comprobante"
        accept="image/jpeg,image/png,application/pdf"
        ayuda={
          subiendo
            ? "Subiendo la foto…"
            : archivo
              ? `Foto cargada: ${archivo.nombre}`
              : "Una captura de pantalla clara. Puede ser JPG, PNG o PDF de hasta 5 MB."
        }
        error={error}
        disabled={subiendo}
        onChange={(e) => {
          const foto = e.target.files?.[0];
          if (foto) void subir(foto);
        }}
      />
      <p>
        Si el problema era el monto, puede pagar la diferencia desde{" "}
        <Link href="/cuota" className="font-bold text-texto-enlace underline underline-offset-4">
          Mi cuota
        </Link>
        .
      </p>
      <Boton type="submit" icono={Send} anchoCompleto cargando={enviando}>
        Enviar la foto nueva
      </Boton>
    </form>
  );
}
