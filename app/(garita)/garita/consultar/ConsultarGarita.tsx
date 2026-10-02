"use client";
// @HU-GAR-06

import {
  ChevronLeft,
  CircleCheck,
  CloudOff,
  DoorOpen,
  Hand,
  Info,
  Search,
  Siren,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { horaCorta } from "@/compartido/fechas";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import type { MotivoEmergencia, ResultadoConsulta } from "@/modulos/identidad/aplicacion/garita";
import { buscarEnInstantanea, leerInstantanea, refrescarInstantanea } from "./instantaneaLocal";

type Respuesta = { resultados: ResultadoConsulta[]; yaNoVive: string | null };
type Consulta = Respuesta & { texto: string; guardadaA: string | null };

const QUINCE_MINUTOS = 15 * 60_000;

const MOTIVOS: { valor: MotivoEmergencia; etiqueta: string }[] = [
  { valor: "SALUD", etiqueta: "Una emergencia de salud (por ejemplo, llega una ambulancia)" },
  { valor: "SEGURIDAD", etiqueta: "Un problema de seguridad" },
  { valor: "OTRO", etiqueta: "Otra urgencia" },
];

export function ConsultarGarita() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string>();
  const [buscando, setBuscando] = useState(false);
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [anotada, setAnotada] = useState<{ titulo: string; texto: string } | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [emergencia, setEmergencia] = useState<ResultadoConsulta | null>(null);
  const [motivo, setMotivo] = useState<MotivoEmergencia | null>(null);
  const [errorMotivo, setErrorMotivo] = useState<string>();
  const [sinRed, setSinRed] = useState(false);
  const tituloEmergencia = useRef<HTMLHeadingElement>(null);

  // La lista guardada se refresca al abrir y cada 15 minutos; el service worker guarda esta pantalla.
  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
    void refrescarInstantanea();
    const intervalo = setInterval(() => void refrescarInstantanea(), QUINCE_MINUTOS);
    const actualizar = () => setSinRed(!navigator.onLine);
    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  useEffect(() => {
    if (emergencia) tituloEmergencia.current?.focus();
  }, [emergencia]);

  async function buscar(evento: FormEvent) {
    evento.preventDefault();
    setAnotada(null);
    setFalla(null);
    if (texto.trim().length < 2) return setError("Escriba una placa, un DNI o un nombre.");
    setError(undefined);
    setBuscando(true);
    const r = await enviarJson<Respuesta>(`/api/garita/consulta?${new URLSearchParams({ texto })}`, "GET");
    if (r.ok) {
      setConsulta({ ...r.datos, texto, guardadaA: null });
    } else if (r.estado === 0) {
      const guardada = await leerInstantanea();
      if (guardada) {
        const resultados = await buscarEnInstantanea(guardada, texto);
        setConsulta({
          resultados,
          yaNoVive: null,
          texto,
          guardadaA: horaCorta(new Date(guardada.generadaEn)),
        });
      } else
        setFalla("No hay internet y la tablet todavía no guardó la lista. Pregunte por radio o teléfono.");
    } else if (r.estado === 400) setError(r.error);
    else setFalla(r.error);
    setBuscando(false);
  }

  async function anotar(resultado: ResultadoConsulta) {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ hora: string; modo: string }>("/api/garita/accesos", "POST", {
      accion: "entrada_vecino",
      predioId: resultado.predioId,
      quien: resultado.quien,
      placa: resultado.placa,
    });
    setEnviando(false);
    if (!r.ok) return setFalla(r.error);
    setConsulta(null);
    setTexto("");
    setAnotada(
      r.datos.modo === "VECINO_A_MANO"
        ? {
            titulo: "Entrada anotada",
            texto: `Quedó en la bitácora que ${resultado.quien} entró abriendo a mano a las ${r.datos.hora}. Le avisamos por qué.`,
          }
        : {
            titulo: "Reja abierta",
            texto: `Anotamos la entrada de ${resultado.quien} a las ${r.datos.hora}.`,
          },
    );
  }

  async function abrirPorEmergencia(evento: FormEvent) {
    evento.preventDefault();
    if (!emergencia) return;
    if (!motivo) return setErrorMotivo("Elija qué pasa para abrir la reja.");
    setEnviando(true);
    const r = await enviarJson("/api/garita/accesos", "POST", {
      accion: "emergencia",
      predioId: emergencia.predioId,
      quien: emergencia.quien,
      placa: emergencia.placa,
      motivo,
    });
    if (r.ok) return router.push("/garita/bitacora?aviso=emergencia");
    setEnviando(false);
    setFalla(r.error);
  }

  if (emergencia) {
    return (
      <form noValidate onSubmit={abrirPorEmergencia} className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setEmergencia(null)}
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <ChevronLeft aria-hidden className="size-icono" />
          Volver
        </button>
        <div className="flex flex-col gap-2">
          <span className="text-texto-secundario">Paso 2 de 2</span>
          <h1 ref={tituloEmergencia} tabIndex={-1} className="text-titulo-1">
            ¿Abrir la reja por una emergencia?
          </h1>
          <p>
            {emergencia.quien} · {emergencia.vivienda}
          </p>
        </div>
        <GrupoOpciones id="campo-motivo" pregunta="¿Qué pasa?" error={errorMotivo}>
          {MOTIVOS.map((m) => (
            <Opcion
              key={m.valor}
              tipo="radio"
              name="motivo"
              etiqueta={m.etiqueta}
              checked={motivo === m.valor}
              onChange={() => {
                setMotivo(m.valor);
                setErrorMotivo(undefined);
              }}
            />
          ))}
        </GrupoOpciones>
        <MensajeEstado tipo="info" titulo="Esto no es un permiso ni una sanción">
          <p>
            Solo deja constancia de que abrió por una emergencia. Avisaremos a la directiva para que lo sepa.
          </p>
        </MensajeEstado>
        {falla && (
          <MensajeEstado tipo="error" titulo="No se anotó la apertura">
            <p>{falla}</p>
          </MensajeEstado>
        )}
        <div className="flex flex-col gap-separacion md:flex-row">
          <Boton type="submit" icono={DoorOpen} cargando={enviando}>
            Sí, abrir la reja ahora
          </Boton>
          <Boton type="button" variante="secundario" onClick={() => setEmergencia(null)}>
            No abrir, volver
          </Boton>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/garita"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al inicio
      </Link>
      <h1 className="text-titulo-1">Consultar vecino o placa</h1>
      {sinRed && (
        <MensajeEstado tipo="aviso" titulo="Sin internet">
          <p className="inline-flex items-center gap-2">
            <WifiOff aria-hidden className="size-icono shrink-0" />
            La garita sigue respondiendo con la lista guardada. Se actualizará sola cuando vuelva la señal.
          </p>
        </MensajeEstado>
      )}
      <form noValidate onSubmit={buscar} className="flex flex-col gap-4 md:flex-row md:items-end">
        <Campo
          name="texto"
          etiqueta="Placa, DNI o nombre"
          ayuda="Por ejemplo: CDF-220, 40000007 o Rosa Díaz."
          autoComplete="off"
          className="md:flex-1"
          value={texto}
          error={error}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Boton type="submit" icono={Search} cargando={buscando}>
          Buscar
        </Boton>
      </form>

      {anotada && (
        <MensajeEstado tipo="exito" titulo={anotada.titulo}>
          <p>{anotada.texto}</p>
        </MensajeEstado>
      )}
      {falla && (
        <MensajeEstado tipo="error" titulo="No se pudo completar">
          <p>{falla}</p>
        </MensajeEstado>
      )}

      {consulta && (
        <section aria-label="Resultado de la consulta" className="flex flex-col gap-4">
          {consulta.yaNoVive && (
            <MensajeEstado tipo="info" titulo={`${consulta.yaNoVive} ya no está en el padrón de la garita`}>
              <p>No pasa como vecino. Si viene a una casa, trátelo como una visita y pregunte en esa casa.</p>
            </MensajeEstado>
          )}
          {!consulta.yaNoVive && consulta.resultados.length === 0 && (
            <MensajeEstado tipo="info" titulo={`No encontramos «${consulta.texto}»`}>
              <p>
                Revise la placa o pruebe con el apellido. Si es una visita,{" "}
                <Link href="/garita/visitas" className="font-bold text-texto-enlace">
                  búsquela en la lista de visitas
                </Link>
                .
              </p>
            </MensajeEstado>
          )}
          {consulta.resultados.map((r) => (
            <article
              key={r.predioId}
              className="flex flex-col gap-4 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              {r.estado === "VERDE" ? (
                <p className="inline-flex items-center gap-2 self-start rounded-control bg-fondo-exito px-3 py-2 font-bold text-texto-exito">
                  <CircleCheck aria-hidden className="size-icono shrink-0" />
                  Vecino del barrio: puede abrirle la reja
                </p>
              ) : (
                <p className="inline-flex items-center gap-2 self-start rounded-control bg-fondo-error px-3 py-2 font-bold text-texto-error">
                  <Hand aria-hidden className="size-icono shrink-0" />
                  Vecino atrasado: la reja no se abre sola
                </p>
              )}
              <div className="flex flex-col gap-1">
                <h2 className="text-titulo-2">{r.quien}</h2>
                <span>{r.vivienda}</span>
                {r.placas.length > 0 && (
                  <span className="text-texto-secundario">Placas: {r.placas.join(", ")}</span>
                )}
              </div>
              <p className="inline-flex items-center gap-2 text-pequeno">
                {consulta.guardadaA ? (
                  <>
                    <CloudOff aria-hidden className="size-icono-pequeno shrink-0 text-texto-aviso" />
                    Sin internet: dato de las {consulta.guardadaA}; puede no estar al día si hubo pagos o
                    cambios después.
                  </>
                ) : (
                  <>
                    <CircleCheck aria-hidden className="size-icono-pequeno shrink-0 text-texto-exito" />
                    Dato al momento.
                  </>
                )}
              </p>
              {r.estado === "ROJO" && (
                <p className="inline-flex items-start gap-2">
                  <Info aria-hidden className="mt-1 size-icono-pequeno shrink-0" />
                  Pídale que abra la reja a mano, como siempre. Le avisaremos por qué no se abre sola.
                </p>
              )}
              {consulta.guardadaA ? (
                <p>
                  Sin internet no se puede anotar ahora. Anote la entrada en la bitácora cuando vuelva la
                  señal.
                </p>
              ) : (
                <div className="flex flex-col gap-separacion md:flex-row">
                  <Boton icono={DoorOpen} cargando={enviando} onClick={() => anotar(r)}>
                    {r.estado === "VERDE"
                      ? "Abrir la reja y anotar la entrada"
                      : "Anotar que entró abriendo a mano"}
                  </Boton>
                  {r.estado === "ROJO" && (
                    <Boton variante="secundario" icono={Siren} onClick={() => setEmergencia(r)}>
                      Abrir por emergencia
                    </Boton>
                  )}
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
