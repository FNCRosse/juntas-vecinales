"use client";
// @HU-COB-07

import { ArrowRight, ChevronLeft, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import { aCentimos, soles } from "@/compartido/dinero";
import type { CasaPorPonerAlDia, DeudaLiquidada } from "@/modulos/aportes/aplicacion/liquidaciones";

type Medio = "EFECTIVO" | "YAPE_O_PLIN" | "TRANSFERENCIA";

const MEDIOS: { valor: Medio; etiqueta: string }[] = [
  { valor: "EFECTIVO", etiqueta: "En efectivo" },
  { valor: "YAPE_O_PLIN", etiqueta: "Yape o Plin" },
  { valor: "TRANSFERENCIA", etiqueta: "Transferencia bancaria" },
];

// DIR-COB-16 y DIR-COB-17: poner al día a una casa que debe varias semanas, en dos pasos. Es dinero y devuelve la apertura de
// la reja, así que lleva su confirmación (R-12). El pago cubre toda la deuda. En efectivo se anota cuánto entregó, para el
// vuelto; por Yape, Plin o transferencia se puede adjuntar la foto del pago (DIR-19).
export function PonerAlDia({ casa }: { casa: CasaPorPonerAlDia }) {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "hecho">("datos");
  const [medio, setMedio] = useState<Medio>("EFECTIVO");
  const [numeroOperacion, setNumeroOperacion] = useState("");
  const [montoRecibido, setMontoRecibido] = useState("");
  const [foto, setFoto] = useState<{ id: string; nombre: string } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [resultado, setResultado] = useState<DeudaLiquidada | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por pago: si se reintenta por una falla de red, no se registra dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const etiquetaDelMedio = MEDIOS.find((m) => m.valor === medio)?.etiqueta ?? "";
  const enEfectivo = medio === "EFECTIVO";
  const recibido = aCentimos(montoRecibido);
  const vuelto = recibido !== null && recibido >= casa.debe ? recibido - casa.debe : null;

  async function subir(archivo: File) {
    setSubiendo(true);
    setErrores({ ...errores, archivoId: "" });
    const pedido = await enviarJson<{
      id: string;
      url: string;
      metodo: string;
      cabeceras: Record<string, string>;
    }>("/api/archivos", "POST", { uso: "comprobante_pago", tipo: archivo.type, tamano: archivo.size });
    const subida =
      pedido.ok &&
      (await fetch(pedido.datos.url, {
        method: pedido.datos.metodo,
        headers: pedido.datos.cabeceras,
        body: archivo,
      })
        .then((r) => r.ok)
        .catch(() => false));
    setSubiendo(false);
    if (!pedido.ok || !subida) {
      setFoto(null);
      return setErrores({
        ...errores,
        archivoId: "No pudimos subir la foto. Use una imagen de hasta 5 MB y revise su internet.",
      });
    }
    setFoto({ id: pedido.datos.id, nombre: archivo.name });
  }

  /** En efectivo, lo que entregó tiene que cubrir toda la deuda; por eso se revisa antes de confirmar. */
  function revisar() {
    const nuevos: Record<string, string> = {};
    if (enEfectivo && recibido === null) {
      nuevos.montoRecibido = "Escriba cuánto le entregó en efectivo, por ejemplo 50 o 50.50.";
    } else if (enEfectivo && recibido! < casa.debe) {
      nuevos.montoRecibido = `Le entregó menos de lo que debe (${soles(casa.debe)}). El pago tiene que cubrir toda la deuda.`;
    }
    setErrores(nuevos);
    if (!Object.keys(nuevos).length) setPaso("confirmar");
  }

  async function registrar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<DeudaLiquidada>("/api/aportes/liquidaciones", "POST", {
      predioId: casa.predioId,
      medio,
      numeroOperacion: enEfectivo ? "" : numeroOperacion,
      ...(enEfectivo ? { montoRecibido } : foto && { archivoId: foto.id }),
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) {
      setResultado(r.datos);
      return setPaso("hecho");
    }
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("datos");
    } else setFalla(r.error);
  }

  if (paso === "hecho" && resultado) {
    const avisados = [
      resultado.nombre,
      ...resultado.garita.map((nombre, i) => (i === 0 ? `${nombre}, de la garita` : nombre)),
    ];
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo={`${resultado.nombre} está al día`}>
          <p>
            {resultado.reabreLaReja ? `El vigilante vuelve a abrirle la reja a ${resultado.vivienda}. ` : ""}
            Avisamos a {avisados.join(" y a ")}, el {resultado.cuando}.
          </p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Se registró el pago total
        </h1>
        <div className="flex flex-col gap-opuestas">
          {resultado.recibo && (
            <BotonEnlace href={`/directiva/cobros/recibos/${resultado.recibo.id}`} icono={Receipt}>
              Ver el recibo N.° {resultado.recibo.numero}
            </BotonEnlace>
          )}
          <BotonEnlace href="/directiva/cobros" variante="secundario" icono={Wallet}>
            Volver a cobros
          </BotonEnlace>
        </div>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={`¿Desea poner al día a ${casa.nombre}?`}
        filas={[
          ["Monto", soles(casa.debe)],
          ["Predio", casa.vivienda],
          ["Semanas", casa.detalle.replace(/^(\d+) semanas?, /, "$1, ")],
          [
            "Medio",
            etiquetaDelMedio +
              (!enEfectivo && numeroOperacion.trim() ? ` · operación ${numeroOperacion.trim()}` : ""),
          ],
          ...(enEfectivo && recibido !== null
            ? ([
                ["Le entregó", soles(recibido)],
                ["Vuelto", soles(recibido - casa.debe)],
              ] as [string, string][])
            : foto
              ? ([["Foto del pago", "Adjunta"]] as [string, string][])
              : []),
        ]}
        efecto={
          casa.rejaSuspendida
            ? "Su estado pasará a Al día y el vigilante volverá a abrirle la reja. Le avisaremos a él y a la garita."
            : "Su estado pasará a Al día y le avisaremos."
        }
        textoConfirmar="Sí, registrar y poner al día"
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
        revisar();
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
          Registrar el pago total de {casa.nombre}
        </h1>
        <p className="text-titulo-2">{soles(casa.debe)}</p>
        <p>{casa.detalle}</p>
        {casa.rejaSuspendida && (
          <p>
            Para que el vigilante vuelva a abrirle la reja, el pago tiene que cubrir todas las semanas
            vencidas.
          </p>
        )}
      </div>
      <SelectorEnHoja<Medio>
        id="campo-medio"
        pregunta="¿Cómo pagó?"
        opciones={MEDIOS}
        valor={medio}
        alElegir={setMedio}
        error={errores.medio}
      />
      {enEfectivo ? (
        <div className="flex flex-col gap-2">
          <Campo
            name="montoRecibido"
            etiqueta="¿Cuánto le entregó?"
            ayuda={`Debe ${soles(casa.debe)}. Escriba lo que le dieron en la mano, para calcular el vuelto.`}
            inputMode="decimal"
            autoComplete="off"
            value={montoRecibido}
            error={errores.montoRecibido}
            onChange={(e) => setMontoRecibido(e.target.value)}
          />
          {vuelto !== null && (
            <p aria-live="polite" className="text-titulo-3">
              {vuelto ? `Vuelto: ${soles(vuelto)}` : "Monto exacto: no hay vuelto."}
            </p>
          )}
        </div>
      ) : (
        <>
          <Campo
            name="numeroOperacion"
            etiqueta="Número de operación (opcional)"
            ayuda="Está en la captura del Yape, del Plin o de la transferencia."
            autoComplete="off"
            maxLength={30}
            value={numeroOperacion}
            error={errores.numeroOperacion}
            onChange={(e) => setNumeroOperacion(e.target.value)}
          />
          <Campo
            name="archivoId"
            type="file"
            etiqueta="Foto del pago (opcional)"
            ayuda={
              subiendo
                ? "Subiendo la foto…"
                : foto
                  ? `Lista: ${foto.nombre}`
                  : "La captura del Yape, del Plin o de la transferencia. Una imagen de hasta 5 MB."
            }
            accept="image/jpeg,image/png"
            error={errores.archivoId}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) void subir(archivo);
            }}
          />
        </>
      )}
      <Boton type="submit" icono={ArrowRight} anchoCompleto disabled={subiendo}>
        Revisar el pago
      </Boton>
    </form>
  );
}
