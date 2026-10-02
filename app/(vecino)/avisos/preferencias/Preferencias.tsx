"use client";
// @HU-GAR-18

import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Interruptor } from "@/componentes/a11y/Interruptor";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import type { Preferencias as Prefs } from "@/modulos/identidad/aplicacion/avisos";

const OPCIONES: [keyof Prefs, string, string][] = [
  ["whatsapp", "Recibir avisos por WhatsApp", "Además de verlos aquí, en Avisos."],
  ["pagos", "Recordatorios de pago", "Un aviso amable cuando tenga una semana pendiente."],
  ["asambleas", "Avisos de asambleas", "Convocatorias, cambios de fecha y actas."],
  ["reportes", "Avance de mis reportes", "Cada vez que cambie el estado de un reporte suyo."],
  ["garita", "Visitas en la garita", "Cuando alguien pregunte por usted en la puerta."],
  ["noticias", "Noticias de la junta", "Comunicados generales del barrio."],
];

// Cada cambio se guarda solo y vale desde el próximo aviso (CA2). Si no se pudo guardar, el
// interruptor vuelve a como estaba y se avisa.
export function Preferencias({ iniciales }: { iniciales: Prefs }) {
  const [prefs, setPrefs] = useState(iniciales);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  async function cambiar(campo: keyof Prefs, valor: boolean) {
    const antes = prefs;
    setPrefs({ ...prefs, [campo]: valor });
    const r = await enviarJson<Prefs>("/api/perfil/notificaciones", "PUT", { [campo]: valor });
    if (r.ok) {
      setPrefs(r.datos);
      setMensaje({ ok: true, texto: "El cambio se aplica desde el próximo aviso." });
    } else {
      setPrefs(antes);
      setMensaje({ ok: false, texto: r.error });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/avisos"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ArrowLeft aria-hidden className="size-icono" />
        Volver a Avisos
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Qué avisos recibo</h1>
        <p>
          Cada cambio se guarda solo y vale desde el próximo aviso. Todos los avisos se ven siempre en Avisos.
        </p>
      </div>
      {mensaje && (
        <MensajeEstado
          tipo={mensaje.ok ? "exito" : "error"}
          titulo={mensaje.ok ? "Guardado" : "No se guardó"}
        >
          <p>{mensaje.texto}</p>
        </MensajeEstado>
      )}
      <div className="flex flex-col gap-separacion">
        {OPCIONES.map(([campo, etiqueta, descripcion]) => (
          <Interruptor
            key={campo}
            etiqueta={etiqueta}
            descripcion={descripcion}
            activo={prefs[campo]}
            alCambiar={(valor) => cambiar(campo, valor)}
          />
        ))}
        <div className="flex min-h-tactil items-center gap-3 rounded-control border-(length:--borde-ancho-control) border-dashed border-borde-control bg-fondo-suave p-3">
          <span className="flex flex-1 flex-col">
            <strong>Avisos importantes de su cuenta, la reja y la seguridad</strong>
            <span className="text-pequeno text-texto-secundario">
              Siempre le llegan, para que nunca se entere tarde de algo que le afecta.
            </span>
          </span>
          <span className="inline-flex items-center gap-1 font-bold">
            <Lock aria-hidden className="size-icono-pequeno" />
            Siempre
          </span>
        </div>
      </div>
    </div>
  );
}
