"use client";
// @HU-GAR-13

import { ChevronLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import type { CampoRectificable } from "@/modulos/identidad/aplicacion/arco";

const AYUDA: Record<CampoRectificable, { etiqueta: string; ayuda: string }> = {
  NOMBRE: { etiqueta: "Su nombre correcto", ayuda: "Como figura en su DNI, con sus dos apellidos." },
  DNI: { etiqueta: "Su DNI correcto", ayuda: "Son 8 números." },
  DIRECCION: {
    etiqueta: "Su vivienda correcta",
    ayuda: 'La manzana y el lote, por ejemplo "Mz. C, lote 8".',
  },
};

export function CorregirDato({ campos }: { campos: Record<CampoRectificable, { opcion: string }> }) {
  const router = useRouter();
  const [campo, setCampo] = useState<CampoRectificable | null>(null);
  const [valor, setValor] = useState("");
  const [detalle, setDetalle] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setFalla(null);
    if (!campo) return setErrores({ campo: "Elija qué dato quiere corregir." });
    setEnviando(true);
    const r = await enviarJson("/api/arco/solicitudes", "POST", {
      tipo: "RECTIFICACION",
      campo,
      valor,
      detalle: detalle || undefined,
    });
    if (r.ok) return router.push("/mas/perfil?aviso=correccion");
    setEnviando(false);
    if (r.estado === 400) setErrores(r.campos);
    else setFalla(r.error);
  }

  const listaErrores = Object.entries(errores).map(([c, mensaje]) => ({ campo: `campo-${c}`, mensaje }));
  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-6">
      <Link
        href="/mas/perfil"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Mi perfil
      </Link>
      <h1 className="text-titulo-1">Corregir un dato</h1>
      <ResumenErrores errores={listaErrores} />
      <GrupoOpciones id="campo-campo" pregunta="¿Qué dato quiere corregir?" error={errores.campo}>
        {(Object.keys(campos) as CampoRectificable[]).map((c) => (
          <Opcion
            key={c}
            tipo="radio"
            name="campo"
            etiqueta={campos[c].opcion}
            checked={campo === c}
            onChange={() => {
              setCampo(c);
              setErrores({});
            }}
          />
        ))}
      </GrupoOpciones>
      {campo && (
        <>
          <Campo
            name="valor"
            etiqueta={AYUDA[campo].etiqueta}
            ayuda={AYUDA[campo].ayuda}
            autoComplete={campo === "NOMBRE" ? "name" : "off"}
            inputMode={campo === "DNI" ? "numeric" : undefined}
            maxLength={campo === "DNI" ? 8 : 120}
            value={valor}
            error={errores.valor}
            onChange={(e) => setValor(campo === "DNI" ? e.target.value.replace(/\D/g, "") : e.target.value)}
          />
          <Campo
            name="detalle"
            etiqueta="Por qué hay que corregirlo (opcional)"
            ayuda="Por ejemplo: «Así figura en mi DNI». La administración puede pedirle ver su documento."
            maxLength={500}
            value={detalle}
            error={errores.detalle}
            onChange={(e) => setDetalle(e.target.value)}
          />
        </>
      )}
      <p>La administración revisará su pedido en un plazo de 10 días hábiles y le avisará.</p>
      {falla && (
        <MensajeEstado tipo="error" titulo="No se envió su solicitud">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={Send} anchoCompleto cargando={enviando}>
        Enviar mi solicitud
      </Boton>
    </form>
  );
}
