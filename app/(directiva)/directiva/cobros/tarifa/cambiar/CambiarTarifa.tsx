"use client";
// @HU-COB-16

import { ArrowRight, Check, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo, MensajeDeCampo } from "@/componentes/a11y/Campo";
import { CerrarDialogo, Dialogo } from "@/componentes/a11y/Dialogo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import { aCentimos, soles } from "@/compartido/dinero";

type Concepto = { clave: string; nombre: string; unidadTexto: string; monto: number; casas: number };
type OpcionDeVigencia = { dia: string; texto: string; esProximo: boolean };
type Datos = {
  concepto: string | null;
  nombre: string;
  unidad: string | null;
  monto: string;
  vigencia: string | null;
  acta: string;
};

const UNIDADES = [
  { valor: "POR_FAMILIA", etiqueta: "Por familia" },
  { valor: "POR_VEHICULO", etiqueta: "Por vehículo" },
  { valor: "POR_INQUILINO", etiqueta: "Por inquilino" },
  { valor: "POR_LOCAL", etiqueta: "Por local" },
];
const MENSAJE_MONTO = "Escriba un monto en soles, por ejemplo 2.50.";

// DIR-COB-22 y DIR-COB-23: cambiar un monto o agregar un concepto en dos pasos. Los datos de un concepto nuevo van en
// una hoja («Datos del concepto nuevo») para que la pantalla no pase de los objetivos permitidos (R-11); cambiar la
// tarifa avisa a las casas afectadas y no se deshace, así que lleva su confirmación (R-12).
export function CambiarTarifa({
  conceptos,
  opciones,
}: {
  conceptos: Concepto[];
  opciones: OpcionDeVigencia[];
}) {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "hecho">("datos");
  const [datos, setDatos] = useState<Datos>({
    concepto: null,
    nombre: "",
    unidad: null,
    monto: "",
    vigencia: opciones[0]?.dia ?? null,
    acta: "",
  });
  const [hojaAbierta, setHojaAbierta] = useState<boolean>(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [avisadas, setAvisadas] = useState(0);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por cambio: si se reintenta por una falla de red, no se programa dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const nuevo = datos.concepto === "nuevo";
  const actual = conceptos.find((c) => c.clave === datos.concepto);
  const monto = aCentimos(datos.monto);
  const vigencia = opciones.find((o) => o.dia === datos.vigencia);
  const unidad = UNIDADES.find((u) => u.valor === datos.unidad);
  const hayDatosNuevos = Boolean(datos.nombre.trim());

  function cambiar(campo: keyof Datos, valor: string) {
    setDatos({ ...datos, [campo]: valor });
    setErrores({ ...errores, [campo === "nombre" || campo === "unidad" ? "datos" : campo]: "" });
  }

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!datos.concepto) nuevos.concepto = "Elija el concepto que va a cambiar.";
    if (nuevo && !datos.nombre.trim()) nuevos.datos = "Escriba el nombre del concepto nuevo.";
    else if (nuevo && !datos.unidad) nuevos.datos = "Elija cómo se cobra el concepto nuevo.";
    if (monto === null || monto === 0) nuevos[nuevo ? "datos" : "monto"] ??= MENSAJE_MONTO;
    if (!datos.vigencia) nuevos.vigencia = "Elija desde cuándo rige.";
    if (!datos.acta.trim()) nuevos.acta = "Escriba el acta de asamblea que lo aprobó.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function confirmar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ avisadas: number }>("/api/aportes/tarifa", "PUT", {
      concepto: datos.concepto,
      nombre: datos.nombre,
      unidad: datos.unidad ?? undefined,
      monto,
      vigencia: datos.vigencia,
      acta: datos.acta,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) {
      setAvisadas(r.datos.avisadas);
      return setPaso("hecho");
    }
    if (r.estado === 400) {
      // Los errores de un dato de la hoja se muestran junto a la fila «Datos del concepto nuevo».
      const { nombre, unidad: sinUnidad, monto: sinMonto, ...resto } = r.campos;
      setErrores(
        nuevo
          ? {
              ...resto,
              ...(nombre || sinUnidad || sinMonto ? { datos: nombre ?? sinUnidad ?? sinMonto } : {}),
            }
          : { ...resto, ...(sinMonto ? { monto: sinMonto } : {}) },
      );
      setPaso("datos");
    } else setFalla(r.error);
  }

  if (paso === "hecho") {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Cambio programado">
          <p>
            Rige desde el {vigencia?.texto.toLowerCase()}.{" "}
            {avisadas > 0
              ? "Avisamos a las casas afectadas."
              : "Ninguna casa paga todavía por este concepto."}
          </p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {nuevo ? datos.nombre.trim() : actual?.nombre}
        </h1>
        <BotonEnlace href="/directiva/cobros/tarifa" icono={Wallet}>
          Volver a la tarifa
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar") {
    const casas = nuevo ? 0 : (actual?.casas ?? 0);
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea cambiar la tarifa?"
        filas={[
          ["Concepto", nuevo ? datos.nombre.trim() : (actual?.nombre ?? "")],
          ["Se cobra", nuevo ? (unidad?.etiqueta ?? "") : (actual?.unidadTexto ?? "")],
          ["Monto actual", nuevo ? "Es un concepto nuevo" : soles(actual?.monto ?? 0)],
          ["Monto nuevo", soles(monto ?? 0)],
          ["Desde", vigencia?.texto.toLowerCase() ?? ""],
          ["Aprobado en", datos.acta.trim()],
        ]}
        efecto={
          casas > 0
            ? `Calcularemos las cuotas con el monto nuevo desde esa fecha y avisaremos ${casas === 1 ? "a la casa afectada" : `a las ${casas} casas afectadas`} antes de que rija. Las cuotas ya emitidas no cambian.`
            : "Calcularemos las cuotas con el monto nuevo desde esa fecha. Todavía ninguna casa paga por este concepto, así que no se avisa a nadie. Las cuotas ya emitidas no cambian."
        }
        textoConfirmar="Sí, cambiar la tarifa"
        enviando={enviando}
        error={falla}
        alConfirmar={confirmar}
        alCorregir={() => setPaso("datos")}
        hrefCancelar="/directiva/cobros/tarifa"
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
        href="/directiva/cobros/tarifa"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a la tarifa
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Cambiar la tarifa
        </h1>
        <p>Solo cambie lo que aprobó la asamblea.</p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <SelectorEnHoja
        id="campo-concepto"
        pregunta="Concepto"
        vacio="Elegir el concepto"
        opciones={[
          ...conceptos.map((c) => ({
            valor: c.clave,
            etiqueta: c.nombre,
            detalle: `${c.unidadTexto} · ${soles(c.monto)} por semana`,
          })),
          { valor: "nuevo", etiqueta: "Agregar un concepto nuevo" },
        ]}
        valor={datos.concepto}
        alElegir={(valor) => {
          setDatos({ ...datos, concepto: valor, monto: "" });
          setErrores({ ...errores, concepto: "", monto: "", datos: "" });
        }}
        error={errores.concepto}
      />
      {actual && (
        <p>
          Hoy: <strong>{`${soles(actual.monto)} ${actual.unidadTexto.toLowerCase()}`}</strong>
        </p>
      )}
      {nuevo ? (
        <div className="flex flex-col gap-3">
          <span id="campo-datos-pregunta" className="font-bold">
            Datos del concepto nuevo
          </span>
          <Dialogo
            variante="hoja"
            titulo="Datos del concepto nuevo"
            abierto={hojaAbierta}
            alCambiar={setHojaAbierta}
            disparador={
              <button
                type="button"
                id="campo-datos"
                aria-haspopup="dialog"
                aria-labelledby="campo-datos-pregunta campo-datos"
                aria-describedby={errores.datos ? "campo-datos-error" : undefined}
                className={`flex min-h-tactil w-full items-center gap-3 rounded-control border-(length:--borde-ancho-control) bg-fondo-superficie px-4 py-2 text-left text-base text-texto-principal cursor-pointer hover:bg-accion-secundaria-hover ${errores.datos ? "border-borde-error" : "border-borde-control"}`}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <strong>{hayDatosNuevos ? datos.nombre.trim() : "Escribir los datos"}</strong>
                  {hayDatosNuevos && (
                    <span className="text-pequeno text-texto-secundario">
                      {[unidad?.etiqueta, monto ? `${soles(monto)} por semana` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 font-bold text-texto-enlace">
                  {hayDatosNuevos ? "Cambiar" : "Escribir"}
                  <ChevronRight aria-hidden className="size-icono-pequeno" />
                </span>
              </button>
            }
          >
            <Campo
              name="nombre"
              etiqueta="Nombre del concepto nuevo"
              autoComplete="off"
              maxLength={40}
              value={datos.nombre}
              onChange={(e) => cambiar("nombre", e.target.value)}
            />
            <GrupoOpciones id="campo-unidad" pregunta="¿Cómo se cobra?">
              {UNIDADES.map((u) => (
                <Opcion
                  key={u.valor}
                  tipo="radio"
                  name="unidad"
                  etiqueta={u.etiqueta}
                  checked={datos.unidad === u.valor}
                  onChange={() => cambiar("unidad", u.valor)}
                />
              ))}
            </GrupoOpciones>
            <Campo
              name="monto"
              etiqueta="Monto nuevo por semana (S/)"
              inputMode="decimal"
              autoComplete="off"
              value={datos.monto}
              onChange={(e) => cambiar("monto", e.target.value)}
            />
            <CerrarDialogo asChild>
              <Boton type="button" icono={Check} anchoCompleto>
                Listo
              </Boton>
            </CerrarDialogo>
          </Dialogo>
          {errores.datos && <MensajeDeCampo id="campo-datos-error">{errores.datos}</MensajeDeCampo>}
        </div>
      ) : (
        <Campo
          name="monto"
          etiqueta="Monto nuevo por semana (S/)"
          ayuda="Por ejemplo: 2.50"
          inputMode="decimal"
          autoComplete="off"
          value={datos.monto}
          error={errores.monto}
          onChange={(e) => cambiar("monto", e.target.value)}
        />
      )}
      <SelectorEnHoja
        id="campo-vigencia"
        pregunta="¿Desde cuándo rige?"
        opciones={opciones.map((o) => ({
          valor: o.dia,
          etiqueta: o.texto,
          detalle: o.esProximo ? "Es el siguiente ciclo semanal: lo más pronto posible" : undefined,
        }))}
        valor={datos.vigencia}
        alElegir={(valor) => cambiar("vigencia", valor)}
        error={errores.vigencia}
      />
      <Campo
        name="acta"
        etiqueta="Acta de asamblea que lo aprobó"
        ayuda="Solo rige desde el siguiente ciclo semanal. Las cuotas ya emitidas mantienen la tarifa con la que se calcularon."
        autoComplete="off"
        maxLength={120}
        value={datos.acta}
        error={errores.acta}
        onChange={(e) => cambiar("acta", e.target.value)}
      />
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar el cambio
      </Boton>
    </form>
  );
}
