"use client";
// @HU-QUE-03

import { ArrowLeft, ArrowRight, EyeOff, Printer, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo, MensajeDeCampo } from "@/componentes/a11y/Campo";
import { Interruptor } from "@/componentes/a11y/Interruptor";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { fechaYHora } from "@/compartido/fechas";
import type { ConstanciaDto } from "@/modulos/incidencias/aplicacion/quejas";

// DIR-QUE-08, DIR-QUE-09 y DIR-QUE-10 (HU-QUE-03): el mediador busca al vecino, escribe lo que cuenta con
// sus palabras, puede reservar su nombre y entrega una constancia impresa con el código de seguimiento.

const CATEGORIAS = [
  ["BASURA", "Basura"],
  ["RUIDOS", "Ruidos molestos"],
  ["COCHERAS", "Cocheras o autos mal estacionados"],
  ["SEGURIDAD", "Seguridad"],
  ["OTROS", "Otro problema"],
] as const;
const OTRO_LUGAR = "otro";

type Vecino = { id: string; nombre: string; casa: string };

export function RegistrarPorVecino({ manzanas }: { manzanas: string[] }) {
  const [paso, setPaso] = useState<"formulario" | "confirmar" | "constancia">("formulario");
  const [busqueda, setBusqueda] = useState<string>("");
  const [resultados, setResultados] = useState<Vecino[] | null>(null);
  const [vecino, setVecino] = useState<Vecino | null>(null);
  const [categoria, setCategoria] = useState<string>("");
  const [manzana, setManzana] = useState<string>("");
  const [referencia, setReferencia] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [anonimo, setAnonimo] = useState<boolean>(false);
  const [consentimiento, setConsentimiento] = useState<boolean>(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [constancia, setConstancia] = useState<ConstanciaDto | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por reporte: si se reintenta por una falla de red, no se registra dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const lugar = manzana === OTRO_LUGAR ? "Otro lugar del barrio" : manzana ? `Mz. ${manzana}` : "";
  const lugarConReferencia = referencia.trim() ? `${lugar}, ${referencia.trim()}` : lugar;

  async function buscar() {
    if (busqueda.trim().length < 2) {
      setResultados(null);
      return setErrores({ vecino: "Escriba al menos dos letras del nombre, el DNI o la manzana." });
    }
    const r = await enviarJson<Vecino[]>(
      `/api/quejas/asistida/vecinos?q=${encodeURIComponent(busqueda.trim())}`,
      "GET",
    );
    setErrores({});
    setResultados(r.ok ? r.datos : []);
    if (!r.ok) setFalla(r.error);
  }

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!vecino) nuevos.vecino = "Busque y elija al vecino que reporta.";
    if (!categoria) nuevos.categoria = "Elija qué tipo de problema es.";
    if (!manzana) nuevos.manzana = "Elija dónde pasa.";
    else if (manzana === OTRO_LUGAR && !referencia.trim())
      nuevos.referencia = "Escriba dónde fue, por ejemplo: la esquina del parque.";
    if (!descripcion.trim()) nuevos.descripcion = "Escriba lo que cuenta el vecino, con sus palabras.";
    if (!consentimiento) nuevos.consentimiento = "Confirme que el vecino aceptó la política de privacidad.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function registrar() {
    if (!vecino) return;
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<ConstanciaDto>("/api/quejas/asistida", "POST", {
      vecinoId: vecino.id,
      categoria,
      descripcion,
      manzana: manzana === OTRO_LUGAR ? null : manzana,
      referencia,
      consentimiento,
      esAnonimo: anonimo,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) {
      setConstancia(r.datos);
      return setPaso("constancia");
    }
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("formulario");
    } else setFalla(r.error);
  }

  if (paso === "constancia" && constancia) {
    return (
      <div className="flex flex-col gap-6">
        <div className="print:hidden">
          <MensajeEstado tipo="exito" titulo="Reporte registrado">
            <p>
              Avisamos a la directiva. Entréguele la constancia a {constancia.vecino} para que pueda seguir el
              avance.
            </p>
          </MensajeEstado>
        </div>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Constancia del reporte {constancia.numero}
        </h1>
        <section
          aria-label="Constancia para imprimir"
          className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
        >
          <div className="flex flex-col">
            <strong>Junta Vecinal Villa de Fátima</strong>
            <span>Constancia de reporte vecinal</span>
          </div>
          <dl className="flex flex-col gap-3">
            {[
              ["Código de seguimiento", constancia.codigo],
              ["Fecha", fechaYHora(new Date(constancia.fechaRegistro))],
              ["Problema", constancia.categoria],
              ["Estado", constancia.estadoTexto],
              ["Registrado por", `${constancia.registradaPor}, directivo mediador, a pedido del vecino`],
              ["Nombre visible", constancia.esAnonimo ? "No, se mantiene en reserva" : "Sí"],
            ].map(([etiqueta, valor]) => (
              <div key={etiqueta} className="flex flex-col">
                <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
                <dd
                  className={
                    etiqueta === "Código de seguimiento" ? "text-titulo-2 break-all font-bold" : "font-bold"
                  }
                >
                  {valor}
                </dd>
              </div>
            ))}
          </dl>
          <p>
            Para saber cómo va, use el código {constancia.codigo} en la app (Incidentes, Buscar con mi código)
            o llame a la directiva.
          </p>
        </section>
        <div className="flex flex-col gap-separacion print:hidden">
          <Boton type="button" icono={Printer} onClick={() => window.print()}>
            Imprimir la constancia
          </Boton>
          <BotonEnlace href="/directiva/incidentes" variante="secundario" icono={ArrowLeft}>
            Volver a incidentes
          </BotonEnlace>
        </div>
      </div>
    );
  }

  if (paso === "confirmar" && vecino) {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea registrar este reporte?"
        filas={[
          ["Vecino que reporta", `${vecino.nombre} · ${vecino.casa}`],
          ["Problema", CATEGORIAS.find(([c]) => c === categoria)?.[1] ?? ""],
          ["Dónde pasa", lugarConReferencia],
          ["Lo que cuenta el vecino", descripcion.trim()],
          ["Nombre visible", anonimo ? "No, se mantiene en reserva" : "Sí"],
        ]}
        efecto="Avisaremos a la directiva y le daremos la constancia con el código para el vecino."
        textoConfirmar="Sí, registrar el reporte"
        enviando={enviando}
        error={falla}
        alConfirmar={registrar}
        alCorregir={() => setPaso("formulario")}
        hrefCancelar="/directiva/incidentes"
      />
    );
  }

  const listaErrores = Object.entries(errores).map(([campo, mensaje]) => ({
    campo: `campo-${campo}`,
    mensaje,
  }));
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
        href="/directiva/incidentes"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ArrowLeft aria-hidden className="size-icono" />
        Volver a incidentes
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Como mediador · Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Registrar un reporte por un vecino
        </h1>
        <p>Escriba lo que le cuenta la persona, con sus palabras.</p>
      </div>
      <ResumenErrores errores={listaErrores} />

      <div className="flex flex-col gap-3">
        {vecino ? (
          <div className="flex flex-wrap items-center gap-3 rounded-control bg-fondo-suave p-4">
            <UserRound aria-hidden className="size-icono shrink-0" />
            <div className="flex flex-1 flex-col">
              <strong>{vecino.nombre}</strong>
              <span>{vecino.casa}</span>
            </div>
            <Boton
              type="button"
              variante="secundario"
              onClick={() => {
                setVecino(null);
                setResultados(null);
              }}
            >
              Cambiar de vecino
            </Boton>
          </div>
        ) : (
          <>
            <Campo
              name="vecino"
              etiqueta="Vecino que reporta"
              ayuda="Escriba el nombre, el DNI o la manzana. Ejemplo: Julia Torres o Mz. D."
              type="search"
              autoComplete="off"
              value={busqueda}
              error={errores.vecino}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void buscar();
                }
              }}
            />
            <Boton type="button" variante="secundario" icono={Search} onClick={() => void buscar()}>
              Buscar al vecino
            </Boton>
            {resultados && resultados.length === 0 && (
              <p role="status">No encontramos a ese vecino. Revise el nombre o busque por manzana.</p>
            )}
            {resultados && resultados.length > 0 && (
              <GrupoOpciones id="resultados-vecino" pregunta="Elija al vecino">
                {resultados.map((v) => (
                  <Opcion
                    key={v.id}
                    tipo="radio"
                    name="vecinoElegido"
                    value={v.id}
                    etiqueta={`${v.nombre} · ${v.casa}`}
                    checked={false}
                    onChange={() => {
                      setVecino(v);
                      setErrores((actuales) =>
                        Object.fromEntries(Object.entries(actuales).filter(([c]) => c !== "vecino")),
                      );
                    }}
                    className="border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie"
                  />
                ))}
              </GrupoOpciones>
            )}
          </>
        )}
      </div>

      <GrupoOpciones id="campo-categoria" pregunta="¿Qué problema es?" error={errores.categoria}>
        {CATEGORIAS.map(([valor, etiqueta]) => (
          <Opcion
            key={valor}
            tipo="radio"
            name="categoria"
            value={valor}
            etiqueta={etiqueta}
            checked={categoria === valor}
            onChange={() => setCategoria(valor)}
            className="border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie"
          />
        ))}
      </GrupoOpciones>

      <GrupoOpciones id="campo-manzana" pregunta="¿Dónde pasa?" error={errores.manzana ?? errores.lugar}>
        <div className="grid grid-cols-2 gap-separacion md:grid-cols-3">
          {[...manzanas, OTRO_LUGAR].map((m) => (
            <Opcion
              key={m}
              tipo="radio"
              name="manzana"
              value={m}
              etiqueta={m === OTRO_LUGAR ? "Otro lugar del barrio" : `Mz. ${m}`}
              checked={manzana === m}
              onChange={() => setManzana(m)}
              className="border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie"
            />
          ))}
        </div>
      </GrupoOpciones>
      <Campo
        name="referencia"
        etiqueta={manzana === OTRO_LUGAR ? "¿Dónde fue?" : "Referencia (opcional)"}
        ayuda="Por ejemplo: la esquina de la Mz. D."
        autoComplete="off"
        maxLength={120}
        value={referencia}
        error={errores.referencia}
        onChange={(e) => setReferencia(e.target.value)}
      />

      <AreaTexto
        name="descripcion"
        etiqueta="Lo que cuenta el vecino"
        rows={4}
        maxLength={1000}
        value={descripcion}
        error={errores.descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />

      <Interruptor
        etiqueta="No mostrar el nombre del vecino"
        descripcion="Si lo pide. Nadie verá quién reportó."
        activo={anonimo}
        alCambiar={setAnonimo}
        icono={<EyeOff aria-hidden className="size-icono shrink-0 text-accion-primaria" />}
      />

      <div id="campo-consentimiento" tabIndex={-1} className="flex flex-col gap-2">
        <label className="flex min-h-tactil cursor-pointer items-start gap-3 rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie p-3 hover:bg-fondo-suave">
          <input
            type="checkbox"
            name="consentimiento"
            checked={consentimiento}
            aria-invalid={errores.consentimiento ? true : undefined}
            aria-describedby={errores.consentimiento ? "consentimiento-error" : undefined}
            onChange={(e) => setConsentimiento(e.target.checked)}
            className="mt-1 size-icono shrink-0 accent-accion-primaria"
          />
          <span>
            <strong>El vecino aceptó la política de privacidad</strong> y confirma que lo que cuenta es
            cierto.
          </span>
        </label>
        {errores.consentimiento && (
          <MensajeDeCampo id="consentimiento-error">{errores.consentimiento}</MensajeDeCampo>
        )}
      </div>

      {falla && (
        <MensajeEstado tipo="error" titulo="No pudimos buscar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar el reporte
      </Boton>
    </form>
  );
}
