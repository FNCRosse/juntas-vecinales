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
import { soles } from "@/compartido/dinero";
import type { CasaPorPonerAlDia, DeudaLiquidada } from "@/modulos/aportes/aplicacion/liquidaciones";

type Medio = "EFECTIVO" | "YAPE_O_PLIN" | "TRANSFERENCIA";

const MEDIOS: { valor: Medio; etiqueta: string }[] = [
  { valor: "EFECTIVO", etiqueta: "En efectivo" },
  { valor: "YAPE_O_PLIN", etiqueta: "Yape o Plin" },
  { valor: "TRANSFERENCIA", etiqueta: "Transferencia bancaria" },
];

// DIR-COB-16 y DIR-COB-17: poner al día a una casa que debe varias semanas, en dos pasos. Es dinero y devuelve la apertura de
// la reja, así que lleva su confirmación (R-12). El pago cubre toda la deuda: no hay un monto que escribir.
export function PonerAlDia({ casa }: { casa: CasaPorPonerAlDia }) {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "hecho">("datos");
  const [medio, setMedio] = useState<Medio>("EFECTIVO");
  const [numeroOperacion, setNumeroOperacion] = useState("");
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

  async function registrar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<DeudaLiquidada>("/api/aportes/liquidaciones", "POST", {
      predioId: casa.predioId,
      medio,
      numeroOperacion,
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
            {resultado.reabreLaReja ? `La reja vuelve a abrirse sola para ${resultado.vivienda}. ` : ""}
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
            etiquetaDelMedio + (numeroOperacion.trim() ? ` · operación ${numeroOperacion.trim()}` : ""),
          ],
        ]}
        efecto={
          casa.rejaSuspendida
            ? "Su estado pasará a Al día y la reja volverá a abrirse sola para su casa. Le avisaremos a él y a la garita."
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
        setErrores({});
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
          Registrar el pago total de {casa.nombre}
        </h1>
        <p className="text-titulo-2">{soles(casa.debe)}</p>
        <p>{casa.detalle}</p>
        {casa.rejaSuspendida && (
          <p>Para devolverle la apertura automática, el pago tiene que cubrir todas las semanas vencidas.</p>
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
      <Campo
        name="numeroOperacion"
        etiqueta="Número de operación (opcional)"
        ayuda="Solo si pagó con Yape, Plin o transferencia."
        autoComplete="off"
        maxLength={30}
        value={numeroOperacion}
        error={errores.numeroOperacion}
        onChange={(e) => setNumeroOperacion(e.target.value)}
      />
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar el pago
      </Boton>
    </form>
  );
}
