"use client";
// @HU-COB-11

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import { soles } from "@/compartido/dinero";
import type { CasaParaCobrar } from "@/modulos/aportes/aplicacion/cobros";
import { type CobroGuardado, guardarCobro, leerCobro, sincronizarCobros } from "../../../colaLocal";
import { ResultadoDelCobro } from "../../../ResultadoDelCobro";
import { useConSenal } from "../../../useConSenal";

// DIR-19: cobrar en efectivo a un vecino que no pidió el cobro en casa, por semanas (las mismas opciones que ve él en
// «Pagar mi cuota»). Igual que «Cobrar en casa»: se guarda primero en el teléfono y se manda en cuanto hay señal (R-05),
// con su confirmación porque es dinero (R-12). Para pagar toda la deuda de una vez está «Poner al día».
export function CobrarEnEfectivo({ casa }: { casa: CasaParaCobrar }) {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "hecho">("datos");
  const [semanas, setSemanas] = useState(String(casa.opciones.at(-1)!.semanas));
  const conSenal = useConSenal();
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [resultado, setResultado] = useState<CobroGuardado | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por cobro: si se reintenta, el servidor no lo registra dos veces (AC-5).
  const idOperacionLocal = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const opcion = casa.opciones.find((o) => String(o.semanas) === semanas)!;

  async function registrar() {
    idOperacionLocal.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    try {
      await guardarCobro({
        idOperacionLocal: idOperacionLocal.current,
        predioId: casa.predioId,
        nombre: casa.nombre,
        vivienda: casa.vivienda,
        monto: opcion.monto,
        reciboEnPapel: false,
        registradoEn: new Date().toISOString(),
      });
    } catch {
      setEnviando(false);
      return setFalla(
        "No pudimos guardar el cobro en su teléfono. Revise que haya espacio y vuelva a intentarlo.",
      );
    }
    await sincronizarCobros().catch(() => undefined);
    setResultado((await leerCobro(idOperacionLocal.current).catch(() => undefined)) ?? null);
    setEnviando(false);
    setPaso("hecho");
  }

  if (paso === "hecho")
    return <ResultadoDelCobro nombre={casa.nombre} resultado={resultado} titulo={titulo} />;

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea registrar este cobro en efectivo?"
        filas={[
          ["Monto", soles(opcion.monto)],
          ["Vecino", casa.nombre],
          ["Predio", casa.vivienda],
          ["Semanas", opcion.detalle],
          ["Medio", "En efectivo, cobrado por la directiva"],
        ]}
        efecto={
          conSenal
            ? "Se registrará el cobro, se emitirá el recibo oficial y se lo enviaremos a su app."
            : "No hay señal: se guardará en su teléfono y se enviará solo cuando vuelva la señal."
        }
        textoConfirmar="Sí, registrar el cobro"
        enviando={enviando}
        error={falla}
        alConfirmar={registrar}
        alCorregir={() => setPaso("datos")}
        hrefCancelar="/directiva/cobros/poner-al-dia"
        textoCancelar="Cancelar, no guardar nada"
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setPaso("confirmar");
      }}
      className="flex flex-col gap-6"
    >
      <Link
        href="/directiva/cobros/poner-al-dia"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a la ficha
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Cobrar en efectivo a {casa.nombre}
        </h1>
        <p>
          {casa.vivienda} · debe {soles(casa.debe)}
        </p>
      </div>
      {!conSenal && (
        <MensajeEstado tipo="aviso" titulo="Aquí no hay señal de internet">
          <p>
            Puede registrar el cobro igual. Se guardará en su teléfono y se enviará solo cuando vuelva la
            señal.
          </p>
        </MensajeEstado>
      )}
      <SelectorEnHoja<string>
        id="campo-semanas"
        pregunta="¿Cuánto le paga?"
        opciones={casa.opciones.map((o) => ({
          valor: String(o.semanas),
          etiqueta: `${o.titulo}: ${soles(o.monto)}`,
          detalle: o.detalle,
        }))}
        valor={semanas}
        alElegir={setSemanas}
      />
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar el cobro
      </Boton>
    </form>
  );
}
