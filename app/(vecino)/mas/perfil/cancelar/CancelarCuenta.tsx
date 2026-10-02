"use client";
// @HU-GAR-14

import { ChevronLeft, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import type { MotivoCancelacion } from "@/modulos/identidad/aplicacion/arco";

const PASARA = [
  "Ya no podrá entrar a la app.",
  "Borraremos sus datos personales.",
  "Solo guardaremos sus pagos, porque la ley lo pide.",
];

export function CancelarCuenta({ motivos }: { motivos: Record<MotivoCancelacion, string> }) {
  const router = useRouter();
  const [motivo, setMotivo] = useState<MotivoCancelacion | null>(null);
  const [error, setError] = useState<string>();
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function pedir() {
    if (!motivo) {
      setError("Elija por qué la cancela.");
      document.querySelector<HTMLInputElement>("#campo-motivo input")?.focus();
      return;
    }
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson("/api/arco/solicitudes", "POST", { tipo: "CANCELACION", motivo });
    if (r.ok) return router.push("/mas/perfil?aviso=cancelacion");
    setEnviando(false);
    setFalla(r.error);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/mas/perfil"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Mi perfil
      </Link>
      <h1 className="text-titulo-1">¿Desea pedir que cancelen su cuenta?</h1>
      <section className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6">
        <h2 className="text-titulo-3">Qué pasará si el administrador lo aprueba</h2>
        <ul className="flex list-disc flex-col gap-1 pl-6">
          {PASARA.map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>
      </section>
      <p>Mientras lo revisan, su cuenta sigue igual. Puede arrepentirse pidiendo ayuda.</p>
      <GrupoOpciones id="campo-motivo" pregunta="¿Por qué la cancela?" error={error}>
        {(Object.keys(motivos) as MotivoCancelacion[]).map((clave) => (
          <Opcion
            key={clave}
            tipo="radio"
            name="motivo"
            etiqueta={motivos[clave]}
            checked={motivo === clave}
            onChange={() => {
              setMotivo(clave);
              setError(undefined);
            }}
          />
        ))}
      </GrupoOpciones>
      {falla && (
        <MensajeEstado tipo="error" titulo="No se envió su pedido">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <div className="flex flex-col gap-separacion">
        <BotonEnlace href="/mas/perfil" variante="secundario">
          No, mantener mi cuenta
        </BotonEnlace>
        <Boton variante="peligro" icono={TriangleAlert} cargando={enviando} onClick={pedir}>
          Sí, pedir la cancelación
        </Boton>
      </div>
    </div>
  );
}
