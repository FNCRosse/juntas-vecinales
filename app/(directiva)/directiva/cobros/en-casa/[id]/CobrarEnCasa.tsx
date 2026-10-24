"use client";
// @HU-COB-11

import { ArrowRight, ChevronLeft, Phone, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import { aCentimos, soles } from "@/compartido/dinero";
import type { PedidoParaCobrar } from "@/modulos/aportes/aplicacion/cobros";
import { CobrosGuardados } from "../../CobrosGuardados";
import { type CobroGuardado, guardarCobro, leerCobro, sincronizarCobros } from "../../colaLocal";
import { useConSenal } from "../../useConSenal";

type CuantoRecibio = "PEDIDO" | "OTRO";
type ReciboEntregado = "DIGITAL" | "PAPEL";

// DIR-COB-08 y DIR-COB-09: cobrar en efectivo en la casa de quien lo pidió, en dos pasos. Con o sin señal: el cobro se
// guarda primero en el teléfono y se manda en cuanto se puede, así que nunca se pierde (R-05); sin señal queda «Pendiente
// de sincronizar». Es dinero, así que lleva su confirmación (R-12). «Cuánto» y «cómo el recibo» van en hojas para no
// pasar de los objetivos permitidos (R-11).
export function CobrarEnCasa({ pedido }: { pedido: PedidoParaCobrar }) {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "hecho">("datos");
  const [cuanto, setCuanto] = useState<CuantoRecibio>("PEDIDO");
  const [otroMonto, setOtroMonto] = useState("");
  const [recibo, setRecibo] = useState<ReciboEntregado>("DIGITAL");
  const [errores, setErrores] = useState<Record<string, string>>({});
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

  const monto = cuanto === "PEDIDO" ? pedido.monto : aCentimos(otroMonto);

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (cuanto === "OTRO") {
      if (!monto || monto <= 0) nuevos.monto = "Escriba cuánto recibió, mayor que cero.";
      else if (monto > pedido.debe) {
        nuevos.monto = `Es más de lo que debe la casa (${soles(pedido.debe)}). Revise el monto.`;
      }
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function registrar() {
    if (!monto) return;
    idOperacionLocal.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    try {
      await guardarCobro({
        idOperacionLocal: idOperacionLocal.current,
        pedidoId: pedido.id,
        nombre: pedido.nombre,
        vivienda: pedido.vivienda,
        monto,
        reciboEnPapel: recibo === "PAPEL",
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

  if (paso === "hecho") {
    return (
      <div className="flex flex-col gap-6">
        {resultado?.estado === "sincronizado" && (
          <>
            <MensajeEstado tipo="exito" titulo="Cobro registrado">
              <p>
                {resultado.alDia
                  ? `${pedido.nombre} queda al día.`
                  : `${pedido.nombre} todavía debe ${soles(resultado.debeAhora ?? 0)}.`}{" "}
                Emitimos el recibo N.° {resultado.reciboNumero} y se lo enviamos a su app
                {resultado.reciboEnPapel ? ". Queda uno en papel por entregar" : ""}.
              </p>
            </MensajeEstado>
            {resultado.excedente ? (
              <MensajeEstado tipo="aviso" titulo={`Sobraron ${soles(resultado.excedente)}`}>
                <p>
                  La casa ya no debía tanto como pensaba. Consulte con la tesorera qué hacer con la
                  diferencia.
                </p>
              </MensajeEstado>
            ) : null}
            <div className="flex flex-col gap-opuestas">
              {resultado.reciboId && (
                <BotonEnlace href={`/directiva/cobros/recibos/${resultado.reciboId}`} icono={Receipt}>
                  Ver el recibo
                </BotonEnlace>
              )}
              <BotonEnlace href="/directiva/cobros" variante="secundario" icono={Wallet}>
                Volver a Cobros
              </BotonEnlace>
            </div>
          </>
        )}
        {resultado?.estado === "con_problema" && (
          <>
            <MensajeEstado tipo="error" titulo="No se pudo registrar el cobro">
              <p>{resultado.mensaje}</p>
            </MensajeEstado>
            <p>El cobro quedó guardado en su teléfono: véalo en «Cobros en efectivo guardados».</p>
            <BotonEnlace href="/directiva/cobros/guardados" icono={Wallet}>
              Cobros en efectivo guardados
            </BotonEnlace>
          </>
        )}
        {resultado?.estado !== "sincronizado" && resultado?.estado !== "con_problema" && (
          <>
            <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
              Cobros en efectivo guardados
            </h1>
            <CobrosGuardados recienGuardado />
            <BotonEnlace href="/directiva/cobros" variante="secundario" icono={Wallet}>
              Volver a cobros
            </BotonEnlace>
          </>
        )}
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea registrar este cobro en efectivo?"
        filas={[
          ["Monto", soles(monto ?? 0)],
          ["Vecina", pedido.nombre],
          ["Predio", pedido.vivienda],
          ["Qué paga", `Abono a su deuda de ${soles(pedido.debe)}`],
          ["Medio", "Efectivo, en su casa"],
          ["Recibo", recibo === "PAPEL" ? "Digital en su app y en papel" : "Digital en su app"],
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
        hrefCancelar="/directiva/cobros"
        textoCancelar="Cancelar, no guardar nada"
      />
    );
  }

  const listaErrores = Object.entries(errores)
    .filter(([, mensaje]) => mensaje)
    .map(([campo, mensaje]) => ({ campo: `campo-${campo}`, mensaje }));
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
        href="/directiva/cobros"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a cobros en casa
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Pedido de cobro en casa N.° {pedido.numero}</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Cobrar en casa de {pedido.nombre}
        </h1>
      </div>
      <MensajeEstado
        tipo={conSenal ? "info" : "aviso"}
        titulo={conSenal ? "Si no hay señal, puede cobrar igual" : "Aquí no hay señal de internet"}
      >
        <p>
          Puede registrar el cobro igual. Se guardará en su teléfono y se enviará solo cuando vuelva la señal.
        </p>
      </MensajeEstado>
      <ResumenErrores errores={listaErrores} />
      <dl className="flex flex-col gap-3">
        {[
          ["Dirección", pedido.vivienda],
          ["Teléfono", pedido.telefono ?? "Sin teléfono registrado"],
          ["Hora que prefiere", pedido.franja],
          ["Lo que pidió pagar", soles(pedido.monto)],
          ["Semanas", pedido.semanas],
        ].map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex flex-col">
            <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
            <dd className="font-bold">{valor}</dd>
          </div>
        ))}
      </dl>
      {pedido.telefono && (
        <a
          href={`tel:${pedido.telefono}`}
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace underline underline-offset-4"
        >
          <Phone aria-hidden className="size-icono" />
          Llamar a {pedido.nombre.split(" ")[0]} para acordar la hora
        </a>
      )}
      <SelectorEnHoja<CuantoRecibio>
        id="campo-cuanto"
        pregunta="¿Cuánto recibió?"
        opciones={[
          { valor: "PEDIDO", etiqueta: `Lo que pidió: ${soles(pedido.monto)}`, detalle: pedido.semanas },
          { valor: "OTRO", etiqueta: "Otro monto" },
        ]}
        valor={cuanto}
        alElegir={(valor) => {
          setCuanto(valor);
          setErrores({ ...errores, monto: "" });
        }}
      />
      {cuanto === "OTRO" && (
        <Campo
          name="monto"
          etiqueta="Monto recibido (S/)"
          inputMode="decimal"
          autoComplete="off"
          ayuda="Si recibe menos de lo que debe, la diferencia queda pendiente."
          error={errores.monto}
          value={otroMonto}
          onChange={(e) => {
            setOtroMonto(e.target.value);
            setErrores({ ...errores, monto: "" });
          }}
        />
      )}
      <SelectorEnHoja<ReciboEntregado>
        id="campo-recibo"
        pregunta="¿Cómo le entrega el recibo?"
        opciones={[
          { valor: "DIGITAL", etiqueta: "Recibo digital en su app" },
          {
            valor: "PAPEL",
            etiqueta: "Recibo digital y también en papel",
            detalle: "Se lo llevarán impreso en la próxima visita",
          },
        ]}
        valor={recibo}
        alElegir={setRecibo}
      />
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar el cobro
      </Boton>
    </form>
  );
}
