"use client";
// @HU-QUE-01 @HU-QUE-02 @HU-QUE-04 @HU-QUE-09

import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CircleCheck,
  EyeOff,
  Info,
  LocateFixed,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo, MensajeDeCampo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { Interruptor } from "@/componentes/a11y/Interruptor";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SeccionPlegable } from "@/componentes/a11y/SeccionPlegable";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import { useVistaGrandeEnTelefono } from "@/componentes/a11y/useVistaEnTelefono";
import { fechaYHora } from "@/compartido/fechas";
import type { QuejaDto } from "@/modulos/incidencias/aplicacion/quejas";

// VEC-QUE-04 a VEC-QUE-07 y VEC-QUE-10 (HU-QUE-01, HU-QUE-04): el formulario con su resumen de lo que
// falta, el lugar elegido tocando (nunca arrastrando, WCAG 2.5.7), la confirmación y la constancia.

const CATEGORIAS = [
  ["RUIDOS", "Ruidos molestos"],
  ["BASURA", "Basura"],
  ["COCHERAS", "Cocheras o autos mal estacionados"],
  ["SEGURIDAD", "Seguridad"],
  ["OTROS", "Otro problema"],
] as const;
const MAXIMO_EVIDENCIAS = 3;
const OTRO_LUGAR = "otro";

type Evidencia = { id: string; nombre: string };
type Lugar = { manzana: string | null; referencia: string; latitud: number | null; longitud: number | null };

export function ReportarProblema({
  manzanas,
  miManzana,
  nombre,
  seniorAlInicio,
}: {
  manzanas: string[];
  miManzana: string | null;
  nombre: string;
  seniorAlInicio: boolean;
}) {
  const plegar = useVistaGrandeEnTelefono(seniorAlInicio);
  const [paso, setPaso] = useState<"formulario" | "lugar" | "confirmar" | "enviado">("formulario");
  const [categoria, setCategoria] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [subiendo, setSubiendo] = useState<boolean>(false);
  const [fallaArchivo, setFallaArchivo] = useState<string>("");
  const [consentimiento, setConsentimiento] = useState<boolean>(false);
  const [anonimo, setAnonimo] = useState<boolean>(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [enviada, setEnviada] = useState<QuejaDto | null>(null);
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

  const quitarError = (campo: string) =>
    setErrores((actuales) => Object.fromEntries(Object.entries(actuales).filter(([c]) => c !== campo)));

  const textoLugar = (l: Lugar) => {
    const base = l.manzana === null ? "Otro lugar del barrio" : `Mz. ${l.manzana}`;
    const referencia = l.referencia.trim();
    return referencia ? `${base}, ${referencia}` : base;
  };

  async function subir(archivo: File) {
    setSubiendo(true);
    setFallaArchivo("");
    const pedido = await enviarJson<{ id: string; url: string; cabeceras: Record<string, string> }>(
      "/api/archivos",
      "POST",
      { uso: "evidencia_queja", tipo: archivo.type, tamano: archivo.size },
    );
    if (!pedido.ok) {
      setSubiendo(false);
      return setFallaArchivo(pedido.campos.archivo ?? pedido.error);
    }
    try {
      const r = await fetch(pedido.datos.url, {
        method: "PUT",
        headers: pedido.datos.cabeceras,
        body: archivo,
      });
      if (!r.ok) throw new Error();
      setEvidencias((lista) => [...lista, { id: pedido.datos.id, nombre: archivo.name }]);
    } catch {
      setFallaArchivo("No pudimos subir el archivo. Revise su internet y vuelva a elegirlo.");
    }
    setSubiendo(false);
  }

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!categoria) nuevos.categoria = "Elija qué tipo de problema es.";
    if (!descripcion.trim())
      nuevos.descripcion =
        'Falta contar qué pasó. Unas pocas palabras bastan, por ejemplo: "música fuerte de noche".';
    if (!lugar) nuevos.lugar = 'Falta el lugar. Pulse "Cerca de mi casa" o elija la manzana.';
    if (subiendo) nuevos.evidencias = "Espere a que termine de subir el archivo.";
    else if (!evidencias.length)
      nuevos.evidencias =
        "Falta una foto o video. Si no puede tomarla, pida ayuda a una persona y la directiva registrará su reporte.";
    if (!consentimiento)
      nuevos.consentimiento = "Falta marcar esta casilla. Es necesaria para registrar el reporte.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function enviar() {
    if (!lugar) return;
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<QuejaDto>("/api/quejas", "POST", {
      categoria,
      descripcion,
      manzana: lugar.manzana,
      referencia: lugar.referencia,
      latitud: lugar.latitud,
      longitud: lugar.longitud,
      evidencias: evidencias.map((e) => e.id),
      consentimiento,
      esAnonimo: anonimo,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) {
      setEnviada(r.datos);
      return setPaso("enviado");
    }
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("formulario");
    } else setFalla(r.error);
  }

  if (paso === "enviado" && enviada) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo={`Recibido el ${fechaYHora(new Date(enviada.fechaRegistro))}`}>
          <p>Avisamos a la directiva que llegó un reporte nuevo.</p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Recibimos su reporte
        </h1>
        <section
          aria-labelledby="titulo-constancia"
          className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
        >
          <h2 id="titulo-constancia" className="text-pequeno text-texto-secundario">
            Número de reporte
          </h2>
          <p className="text-dato font-bold">{enviada.numero}</p>
          <p className="inline-flex items-center gap-2 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 font-bold text-texto-info">
            <Info aria-hidden className="size-icono-pequeno" />
            {enviada.estadoTexto}
          </p>
          <div className="flex flex-col gap-1 rounded-control bg-fondo-suave p-4">
            <span>
              Su <strong>código de seguimiento</strong> es:
            </span>
            <strong className="text-titulo-2 break-all">{enviada.codigo}</strong>
            <span>
              {enviada.esAnonimo
                ? "Guárdelo. Con él puede ver el avance aunque haya enviado el reporte sin su nombre."
                : "Guárdelo. Con él puede ver el avance de su reporte."}
            </span>
          </div>
        </section>
        <BotonEnlace href={`/incidentes/${enviada.id}`} icono={ArrowRight}>
          Ver el avance de mi reporte
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar" && lugar) {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea enviar este reporte?"
        filas={[
          [
            "Qué pasó",
            `${CATEGORIAS.find(([c]) => c === categoria)?.[1] ?? ""}: ${descripcion.trim()}`,
            () => setPaso("formulario"),
          ],
          ["Dónde", textoLugar(lugar), () => setPaso("lugar")],
          [
            "Foto y nombre",
            `${evidencias.map((e) => e.nombre).join(", ")} · ${anonimo ? "sin su nombre (anónimo)" : nombre}`,
            () => setPaso("formulario"),
          ],
        ]}
        efecto="Al enviarlo, confirma que acepta la política de privacidad de la junta y que lo que cuenta es cierto. La directiva lo revisará y le avisaremos cada vez que avance."
        textoCancelar="Cancelar, no enviar"
        textoConfirmar="Sí, enviar mi reporte"
        enviando={enviando}
        error={falla}
        alConfirmar={enviar}
        alCorregir={() => setPaso("formulario")}
        hrefCancelar="/incidentes"
      />
    );
  }

  if (paso === "lugar") {
    return (
      <ElegirLugar
        titulo={titulo}
        manzanas={manzanas}
        inicial={lugar}
        alVolver={() => setPaso("formulario")}
        alElegir={(l) => {
          setLugar(l);
          quitarError("lugar");
          setPaso("formulario");
        }}
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
        href="/incidentes"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ArrowLeft aria-hidden className="size-icono" />
        Volver a Incidentes
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Reportar un problema
        </h1>
      </div>
      {listaErrores.length > 0 && (
        <p className="sr-only" aria-live="polite">
          {listaErrores.length === 1
            ? "Falta 1 dato para enviar su reporte"
            : `Faltan ${listaErrores.length} datos para enviar su reporte`}
        </p>
      )}
      <ResumenErrores errores={listaErrores} />
      {listaErrores.length > 0 && (
        <p>Lo que ya escribió está guardado. Complete lo que está marcado abajo.</p>
      )}

      <SelectorEnHoja
        id="campo-categoria"
        pregunta="¿Qué tipo de problema es?"
        vacio="Elija el tipo"
        opciones={CATEGORIAS.map(([valor, etiqueta]) => ({ valor, etiqueta }))}
        valor={(categoria || null) as (typeof CATEGORIAS)[number][0] | null}
        alElegir={(valor) => {
          setCategoria(valor);
          quitarError("categoria");
        }}
        error={errores.categoria}
      />

      <AreaTexto
        name="descripcion"
        etiqueta="¿Qué pasó?"
        rows={3}
        maxLength={1000}
        value={descripcion}
        error={errores.descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />

      <SelectorEnHoja
        id="campo-lugar"
        pregunta="¿Dónde fue?"
        vacio="Elija el lugar"
        mostrar={lugar ? textoLugar(lugar) : undefined}
        opciones={[
          ...(miManzana ? [{ valor: "casa", etiqueta: "Cerca de mi casa" }] : []),
          { valor: "lista", etiqueta: "Elegir la manzana en la lista" },
        ]}
        valor={null}
        alElegir={(valor) => {
          if (valor === "lista") return setPaso("lugar");
          setLugar({ manzana: miManzana, referencia: "cerca de mi casa", latitud: null, longitud: null });
          quitarError("lugar");
        }}
        error={errores.lugar}
      />

      <SeccionPlegable
        titulo="Foto y nombre (opcional)"
        plegable={plegar}
        abrirSiError={Boolean(errores.evidencias || fallaArchivo || errores.consentimiento)}
      >
        <div className="flex flex-col gap-3">
          <Campo
            name="evidencias"
            etiqueta="Foto o video de lo que pasó"
            ayuda={
              subiendo
                ? "Subiendo el archivo…"
                : "Ayuda a la directiva a entender el problema. Una foto (JPG o PNG) o un video MP4 corto."
            }
            type="file"
            accept="image/jpeg,image/png,video/mp4"
            disabled={evidencias.length >= MAXIMO_EVIDENCIAS}
            error={errores.evidencias ?? (fallaArchivo || undefined)}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              e.target.value = "";
              if (archivo) void subir(archivo);
            }}
          />
          {evidencias.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label="Archivos adjuntos">
              {evidencias.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2">
                    <CircleCheck aria-hidden className="size-icono text-texto-exito" />
                    {e.nombre}
                  </span>
                  <Boton
                    type="button"
                    variante="secundario"
                    icono={Trash2}
                    onClick={() => setEvidencias((lista) => lista.filter((x) => x.id !== e.id))}
                  >
                    {`Quitar ${e.nombre}`}
                  </Boton>
                </li>
              ))}
            </ul>
          )}
          <p className="inline-flex items-center gap-2 text-pequeno text-texto-secundario">
            <Camera aria-hidden className="size-icono-pequeno" />
            Puede adjuntar hasta {MAXIMO_EVIDENCIAS} archivos.
          </p>
        </div>

        <Interruptor
          etiqueta="Enviar sin mi nombre (modo anónimo)"
          descripcion="Nadie verá quién lo envió. Le daremos un código para seguirlo."
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
              onChange={(e) => {
                setConsentimiento(e.target.checked);
                if (e.target.checked) quitarError("consentimiento");
              }}
              className="mt-1 size-icono shrink-0 accent-accion-primaria"
            />
            <span>
              <strong>Acepto la política de privacidad</strong> y confirmo que lo que cuento es cierto.
            </span>
          </label>
          {errores.consentimiento && (
            <MensajeDeCampo id="consentimiento-error">{errores.consentimiento}</MensajeDeCampo>
          )}
        </div>
      </SeccionPlegable>

      <Boton type="submit" icono={Check} anchoCompleto>
        Revisar mi reporte
      </Boton>
    </form>
  );
}

// VEC-QUE-05: se elige la manzana tocándola en la lista, sin arrastrar; la ubicación exacta es opcional.
function ElegirLugar({
  titulo,
  manzanas,
  inicial,
  alVolver,
  alElegir,
}: {
  titulo: React.RefObject<HTMLHeadingElement | null>;
  manzanas: string[];
  inicial: Lugar | null;
  alVolver: () => void;
  alElegir: (lugar: Lugar) => void;
}) {
  const [eleccion, setEleccion] = useState(inicial ? (inicial.manzana ?? OTRO_LUGAR) : "");
  const [referencia, setReferencia] = useState(inicial?.referencia ?? "");
  const [ubicacion, setUbicacion] = useState(
    inicial?.latitud != null ? { latitud: inicial.latitud, longitud: inicial.longitud! } : null,
  );
  const [buscando, setBuscando] = useState<boolean>(false);
  const [error, setError] = useState<Record<string, string>>({});

  function usarMiUbicacion() {
    if (!("geolocation" in navigator)) {
      return setError({ ubicacion: "Su teléfono no permite compartir la ubicación. Elija la manzana." });
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setBuscando(false);
        setError({});
        setUbicacion({
          latitud: Number(posicion.coords.latitude.toFixed(5)),
          longitud: Number(posicion.coords.longitude.toFixed(5)),
        });
      },
      () => {
        setBuscando(false);
        setError({ ubicacion: "No pudimos leer su ubicación. Puede seguir: basta con la manzana." });
      },
      { timeout: 15000 },
    );
  }

  function usar() {
    if (!eleccion) return setError({ manzana: "Elija la manzana donde pasó." });
    if (eleccion === OTRO_LUGAR && !referencia.trim())
      return setError({ referencia: "Escriba dónde fue, por ejemplo: la esquina del parque." });
    alElegir({
      manzana: eleccion === OTRO_LUGAR ? null : eleccion,
      referencia,
      latitud: ubicacion?.latitud ?? null,
      longitud: ubicacion?.longitud ?? null,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={alVolver}
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace underline underline-offset-4 cursor-pointer"
      >
        <ArrowLeft aria-hidden className="size-icono" />
        Volver al reporte
      </button>
      <div className="flex flex-col gap-2">
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          ¿Dónde fue?
        </h1>
        <p>Toque una manzana de la lista. No hace falta arrastrar nada.</p>
      </div>
      <SelectorEnHoja
        id="campo-manzana"
        pregunta="Manzana o lugar"
        vacio="Elija la manzana"
        opciones={[...manzanas, OTRO_LUGAR].map((m) => ({
          valor: m,
          etiqueta: m === OTRO_LUGAR ? "Otro lugar del barrio" : `Mz. ${m}`,
        }))}
        valor={eleccion || null}
        alElegir={setEleccion}
        error={error.manzana}
      />
      <Campo
        name="referencia"
        etiqueta={eleccion === OTRO_LUGAR ? "¿Dónde fue?" : "Referencia (opcional)"}
        ayuda="Por ejemplo: frente al parque."
        autoComplete="off"
        maxLength={120}
        value={referencia}
        error={error.referencia}
        onChange={(e) => setReferencia(e.target.value)}
      />
      <div className="flex flex-col gap-2">
        <Boton
          type="button"
          variante="secundario"
          icono={LocateFixed}
          onClick={usarMiUbicacion}
          disabled={buscando}
        >
          {buscando ? "Buscando su ubicación…" : "Agregar mi ubicación exacta (opcional)"}
        </Boton>
        {ubicacion && (
          <p role="status" className="inline-flex items-center gap-2">
            <CircleCheck aria-hidden className="size-icono text-texto-exito" />
            Ubicación agregada. Solo la ve la directiva; el mapa del barrio muestra la manzana.
          </p>
        )}
        {error.ubicacion && <MensajeDeCampo id="ubicacion-error">{error.ubicacion}</MensajeDeCampo>}
      </div>
      <p>
        Lugar elegido:{" "}
        <strong>
          {eleccion
            ? eleccion === OTRO_LUGAR
              ? "Otro lugar del barrio"
              : `Mz. ${eleccion}`
            : "todavía ninguno"}
        </strong>
      </p>
      <Boton type="button" icono={Check} anchoCompleto onClick={usar}>
        Usar este lugar
      </Boton>
    </div>
  );
}
