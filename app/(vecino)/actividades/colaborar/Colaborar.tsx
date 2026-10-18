"use client";
// @HU-ASA-08 @HU-ASA-09

import { ArrowRight, ChevronLeft, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton } from "@/componentes/a11y/Boton";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";

type Modalidad = "ANTICIPADA" | "EN_PUERTA" | "VOLUNTARIO";

const ETIQUETAS: Record<Modalidad, { opcion: string; detalle?: string; resumen: string }> = {
  ANTICIPADA: {
    opcion: "Pagar antes con Yape o Plin",
    detalle: "Luego sube la foto del comprobante",
    resumen: "Pago antes con Yape o Plin",
  },
  EN_PUERTA: {
    opcion: "Pagar en la puerta el día de la actividad",
    resumen: "Pago en la puerta el día de la actividad",
  },
  VOLUNTARIO: {
    opcion: "Prefiero ayudar como voluntaria",
    detalle: "Si la directiva lo aprueba, no paga la colaboración",
    resumen: "Ayuda como voluntaria (sin pago)",
  },
};

const MINIMO = 1;
const MAXIMO = 10;

const soles = (centimos: number) => `S/ ${(centimos / 100).toFixed(2)}`;

// VEC-ASA-11 y VEC-ASA-12: elegir cuántos y cómo colaborar, y confirmar. Registrar un aporte no cobra nada en el
// momento (se paga antes con Yape o en la puerta), pero compromete a la casa, así que lleva su paso de
// confirmación (R-12).
export function Colaborar({
  actividadId,
  nombre,
  cuando,
  cuandoCorto,
  paraQue,
  precio,
  unidad,
  modalidades,
  pideVoluntarios,
}: {
  actividadId: string;
  nombre: string;
  /** «Domingo 25 de octubre, 12:00 m.» */
  cuando: string;
  /** «domingo 25 de octubre» */
  cuandoCorto: string;
  paraQue: string;
  /** Céntimos por unidad. */
  precio: number;
  unidad: { singular: string; plural: string };
  modalidades: Modalidad[];
  pideVoluntarios: boolean;
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<"elegir" | "confirmar">("elegir");
  const opciones: Modalidad[] = pideVoluntarios ? [...modalidades, "VOLUNTARIO"] : modalidades;
  const [modalidad, setModalidad] = useState<Modalidad | null>(opciones.length === 1 ? opciones[0] : null);
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState<string | undefined>();
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por aporte: si se reintenta por una falla de red, no se registra dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const palabra = cantidad === 1 ? unidad.singular : unidad.plural;

  function revisar() {
    if (!modalidad) return setError("Elija cómo desea colaborar.");
    if (modalidad === "VOLUNTARIO" && !descripcion.trim())
      return setError("Cuéntenos cómo le gustaría ayudar.");
    setError(undefined);
    setPaso("confirmar");
  }

  async function confirmar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r =
      modalidad === "VOLUNTARIO"
        ? await enviarJson(`/api/eventos/${actividadId}/voluntariado`, "POST", {
            descripcion,
            idOperacion: idOperacion.current,
          })
        : await enviarJson(`/api/eventos/${actividadId}/colaboraciones`, "POST", {
            cantidad,
            modalidad,
            idOperacion: idOperacion.current,
          });
    setEnviando(false);
    if (r.ok) return router.push("/actividades");
    setFalla(r.error);
  }

  if (paso === "confirmar" && modalidad) {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea confirmar su aporte?"
        filas={
          modalidad === "VOLUNTARIO"
            ? [
                ["Cómo", ETIQUETAS[modalidad].resumen, () => setPaso("elegir")],
                ["Cómo ayudaría", descripcion.trim(), () => setPaso("elegir")],
                ["Actividad", `${nombre}, ${cuandoCorto}`],
              ]
            : [
                ["Total", soles(cantidad * precio)],
                [
                  palabra.charAt(0).toUpperCase() + palabra.slice(1),
                  String(cantidad),
                  () => setPaso("elegir"),
                ],
                ["Cómo", ETIQUETAS[modalidad].resumen, () => setPaso("elegir")],
                ["Actividad", `${nombre}, ${cuandoCorto}`],
              ]
        }
        efecto={
          modalidad === "VOLUNTARIO"
            ? "La directiva revisará su ofrecimiento y le avisará. Si lo aprueba, no paga la colaboración. Puede cancelar ahora sin problema."
            : "Si elige pagar en la puerta, ese día le cobrarán y le darán su recibo. Puede cancelar ahora sin problema."
        }
        textoConfirmar="Sí, confirmar mi aporte"
        textoCancelar="Cancelar, no aportar ahora"
        enviando={enviando}
        error={falla}
        alConfirmar={confirmar}
        alCorregir={() => setPaso("elegir")}
        hrefCancelar="/actividades"
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        revisar();
      }}
      className="flex flex-col gap-6"
    >
      <Link
        href="/actividades"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Actividades
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {nombre}
        </h1>
        <p className="font-bold">{cuando}</p>
        <p>
          {paraQue} Colaboración: {soles(precio)} por {unidad.singular}.
        </p>
      </div>
      <SelectorEnHoja
        id="campo-modalidad"
        pregunta="¿Cómo desea colaborar?"
        vacio="Elegir una opción"
        opciones={opciones.map((m) => ({
          valor: m,
          etiqueta: ETIQUETAS[m].opcion,
          detalle: ETIQUETAS[m].detalle,
        }))}
        valor={modalidad}
        alElegir={setModalidad}
        error={error}
      />
      {modalidad === "VOLUNTARIO" ? (
        <AreaTexto
          name="descripcion"
          etiqueta="¿Cómo le gustaría ayudar?"
          rows={3}
          maxLength={300}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="font-bold">¿Cuántos {unidad.plural}?</p>
          <div className="flex flex-wrap items-center gap-4">
            <Boton
              type="button"
              variante="secundario"
              icono={Minus}
              disabled={cantidad <= MINIMO}
              onClick={() => setCantidad(Math.max(MINIMO, cantidad - 1))}
            >
              Uno menos
            </Boton>
            <span aria-live="polite" className="min-w-8 text-center text-dato font-bold">
              {cantidad}
            </span>
            <Boton
              type="button"
              variante="secundario"
              icono={Plus}
              disabled={cantidad >= MAXIMO}
              onClick={() => setCantidad(Math.min(MAXIMO, cantidad + 1))}
            >
              Uno más
            </Boton>
          </div>
          <p className="font-bold">Total: {soles(cantidad * precio)}</p>
        </div>
      )}
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar mi aporte
      </Boton>
    </form>
  );
}
