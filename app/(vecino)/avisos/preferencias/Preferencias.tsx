"use client";
// @HU-GAR-18

import { ArrowLeft, ChevronDown, ChevronUp, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AvisoDeshacer } from "@/componentes/a11y/AvisoDeshacer";
import { Interruptor } from "@/componentes/a11y/Interruptor";
import { useVistaGrandeEnTelefono } from "@/componentes/a11y/useVistaEnTelefono";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import type { Preferencias as Prefs } from "@/modulos/identidad/aplicacion/avisos";

// En vista grande y en el teléfono, las seis opciones van en dos grupos plegables (prototipo, R-11): el
// grupo abierto muestra tres y no pasan de seis objetivos por pantalla.
const GRUPOS: { id: string; titulo: string; claves: (keyof Prefs)[] }[] = [
  { id: "g1", titulo: "WhatsApp, pagos y asambleas", claves: ["whatsapp", "pagos", "asambleas"] },
  { id: "g2", titulo: "Mi casa y el barrio", claves: ["reportes", "garita", "noticias"] },
];

const OPCIONES: [keyof Prefs, string, string][] = [
  ["whatsapp", "Recibir avisos por WhatsApp", "Además de verlos aquí, en Avisos."],
  ["pagos", "Recordatorios de pago", "Un aviso amable cuando tenga una semana pendiente."],
  ["asambleas", "Avisos de asambleas", "Convocatorias, cambios de fecha y actas."],
  ["reportes", "Avance de mis reportes", "Cada vez que cambie el estado de un reporte suyo."],
  ["garita", "Visitas en la garita", "Cuando alguien pregunte por usted en la puerta."],
  ["noticias", "Noticias de la junta", "Comunicados generales del barrio."],
];

// Cada cambio se guarda solo y vale desde el próximo aviso (CA2): es una acción reversible, así que
// no pide confirmación y muestra "Listo" con "Deshacer" (R-12). Si no se pudo guardar, el interruptor
// vuelve a como estaba y se avisa.
export function Preferencias({ iniciales, seniorAlInicio }: { iniciales: Prefs; seniorAlInicio: boolean }) {
  const [prefs, setPrefs] = useState(iniciales);
  const [grupoAbierto, setGrupoAbierto] = useState("g1");
  const enGrupos = useVistaGrandeEnTelefono(seniorAlInicio);
  // "deshacer" guarda cómo estaba el interruptor que se acaba de cambiar.
  const [mensaje, setMensaje] = useState<
    { ok: true; deshacer: { campo: keyof Prefs; valor: boolean } } | { ok: false; texto: string } | null
  >(null);

  async function guardar(campo: keyof Prefs, valor: boolean) {
    const antes = prefs;
    setPrefs({ ...prefs, [campo]: valor });
    const r = await enviarJson<Prefs>("/api/perfil/notificaciones", "PUT", { [campo]: valor });
    if (r.ok) {
      setPrefs(r.datos);
      return true;
    }
    setPrefs(antes);
    setMensaje({ ok: false, texto: r.error });
    return false;
  }

  async function cambiar(campo: keyof Prefs, valor: boolean) {
    const antes = prefs[campo];
    if (await guardar(campo, valor)) setMensaje({ ok: true, deshacer: { campo, valor: antes } });
  }

  async function deshacer() {
    if (mensaje?.ok) await guardar(mensaje.deshacer.campo, mensaje.deshacer.valor);
    setMensaje((actual) => (actual?.ok ? null : actual));
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
        <p className="text-texto-secundario">Cada cambio se guarda solo y vale desde el próximo aviso.</p>
      </div>
      {mensaje?.ok && (
        <AvisoDeshacer
          texto="El cambio vale desde el próximo aviso."
          alDeshacer={deshacer}
          alCerrar={() => setMensaje(null)}
        />
      )}
      {mensaje && !mensaje.ok && (
        <MensajeEstado tipo="error" titulo="No se guardó">
          <p>{mensaje.texto}</p>
        </MensajeEstado>
      )}
      <div className="flex flex-col gap-separacion">
        {(enGrupos ? GRUPOS : [{ id: "todas", titulo: "", claves: OPCIONES.map(([c]) => c) }]).map(
          (grupo) => {
            const abierto = !enGrupos || grupoAbierto === grupo.id;
            return (
              <div key={grupo.id} className="flex flex-col gap-separacion">
                {enGrupos && (
                  <button
                    type="button"
                    aria-expanded={abierto}
                    onClick={() => setGrupoAbierto(grupo.id)}
                    className="flex min-h-tactil w-full items-center gap-3 rounded-control bg-fondo-suave px-4 py-2 text-left text-titulo-3 font-bold text-texto-principal cursor-pointer"
                  >
                    <span className="flex-1">{grupo.titulo}</span>
                    {abierto ? (
                      <ChevronUp aria-hidden className="size-icono shrink-0" />
                    ) : (
                      <ChevronDown aria-hidden className="size-icono shrink-0" />
                    )}
                  </button>
                )}
                {abierto &&
                  OPCIONES.filter(([campo]) => grupo.claves.includes(campo)).map(
                    ([campo, etiqueta, descripcion]) => (
                      <Interruptor
                        key={campo}
                        etiqueta={etiqueta}
                        descripcion={descripcion}
                        activo={prefs[campo]}
                        alCambiar={(valor) => cambiar(campo, valor)}
                      />
                    ),
                  )}
              </div>
            );
          },
        )}
        <div className="flex min-h-tactil items-center gap-3 rounded-control border-(length:--borde-ancho-control) border-dashed border-borde-control bg-fondo-suave p-3">
          <span className="flex flex-1 flex-col">
            <strong>Avisos importantes de la reja y de seguridad</strong>
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
