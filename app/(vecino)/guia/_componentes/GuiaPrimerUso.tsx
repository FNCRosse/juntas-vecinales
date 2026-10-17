"use client";
// @HU-GAR-03

import { ArrowRight, CircleHelp, Pause, Smartphone, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { cambiarVista } from "@/componentes/a11y/cambiarVista";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// Cuatro pasos como máximo, uno a la vez; se puede pausar o saltar (prototipo VEC-ACC-08). El primero
// pregunta cómo prefiere ver la aplicación, con la vista grande marcada de antemano (HU-ACC-01 CA4); el
// último ofrece el acceso directo: con el aviso del navegador si existe; si no, cómo hacerlo a mano.

type AvisoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const PASOS = [
  {
    titulo: "Su cuota, siempre a la vista",
    texto:
      "Apenas entre, verá cuánto paga por semana y si debe algo. No tiene que buscarlo ni preguntarle a nadie.",
    Icono: Wallet,
  },
  {
    titulo: "Si algo se le complica, pida ayuda",
    texto:
      "Arriba de cada pantalla está el botón Pedir ayuda. Alguien de la directiva le llamará o le visitará.",
    Icono: CircleHelp,
  },
  {
    titulo: "Tenga la app en su pantalla",
    texto:
      "Así la abre con un toque, como WhatsApp, y no tiene que volver a entrar. Su teléfono le preguntará si desea agregarla.",
    Icono: Smartphone,
  },
];

type Vista = "grande" | "normal";

const VISTAS: { valor: Vista; titulo: string; texto: string; muestra: string }[] = [
  {
    valor: "grande",
    titulo: "Vista grande",
    texto: "Letra, botones y espacios más grandes. Menos opciones por pantalla.",
    muestra: "text-titulo-1",
  },
  {
    valor: "normal",
    titulo: "Vista normal",
    texto: "Letra y botones de tamaño habitual. Más opciones a la vista.",
    muestra: "text-base",
  },
];

// El paso 0 es la elección de vista; los demás son los de PASOS.
const TOTAL_PASOS = PASOS.length + 1;

export function GuiaPrimerUso() {
  const [paso, setPaso] = useState(0);
  const [vista, setVista] = useState<Vista>("grande");
  const [vistaElegida, setVistaElegida] = useState(false);
  const [noGuardado, setNoGuardado] = useState(false);
  const [aviso, setAviso] = useState<AvisoInstalar | null>(null);
  // Solo se muestra en el último paso, después de hidratar: leerlo al iniciar no cambia el HTML.
  const [instalada, setInstalada] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches,
  );
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    const guardar = (evento: Event) => {
      evento.preventDefault();
      setAviso(evento as AvisoInstalar);
    };
    const alInstalar = () => setInstalada(true);
    window.addEventListener("beforeinstallprompt", guardar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const esVista = paso === 0;
  const {
    titulo: textoTitulo,
    texto,
    Icono,
  } = esVista ? { titulo: "¿Cómo prefiere ver la aplicación?", texto: "", Icono: null } : PASOS[paso - 1];
  const ultimo = paso === TOTAL_PASOS - 1;

  async function elegirVista(nueva: Vista) {
    setVista(nueva);
    setVistaElegida(true);
    setNoGuardado(!(await cambiarVista(nueva === "grande")));
  }

  /** Si siguió sin tocar nada, vale lo que venía marcado: la vista grande. */
  async function siguiente() {
    if (esVista && !vistaElegida && document.documentElement.dataset.mode !== "senior") {
      setNoGuardado(!(await cambiarVista(true)));
    }
    setPaso(paso + 1);
  }

  async function instalar() {
    if (!aviso) return;
    await aviso.prompt();
    if ((await aviso.userChoice).outcome === "accepted") setInstalada(true);
    setAviso(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">
          Guía rápida · paso {paso + 1} de {TOTAL_PASOS} · es opcional
        </p>
        <h1 id="titulo-vista" ref={titulo} tabIndex={-1} className="text-titulo-1">
          {textoTitulo}
        </h1>
      </div>
      {esVista ? (
        <>
          <div role="radiogroup" aria-labelledby="titulo-vista" className="flex flex-col gap-separacion">
            {VISTAS.map((v) => (
              <label
                key={v.valor}
                className={`flex min-h-tactil cursor-pointer items-center gap-4 rounded-tarjeta border-(length:--borde-ancho-control) bg-fondo-superficie p-4 senior:p-6 ${vista === v.valor ? "border-accion-primaria" : "border-borde-sutil"}`}
              >
                <input
                  type="radio"
                  name="vista"
                  value={v.valor}
                  checked={vista === v.valor}
                  onChange={() => elegirVista(v.valor)}
                  className="size-icono shrink-0 accent-accion-primaria"
                />
                <span aria-hidden className={`font-bold text-accion-primaria ${v.muestra}`}>
                  Aa
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <strong className="text-titulo-3">{v.titulo}</strong>
                  <span>{v.texto}</span>
                </span>
              </label>
            ))}
          </div>
          {noGuardado && (
            <MensajeEstado
              tipo="aviso"
              titulo="No pudimos guardar su preferencia. Se mantendrá en este teléfono."
            />
          )}
          <p>Puede cambiarlo cuando quiera con el botón Vista grande.</p>
        </>
      ) : (
        <>
          {Icono && <Icono aria-hidden className="size-16 self-center text-accion-primaria" />}
          <p>{texto}</p>
        </>
      )}

      {ultimo &&
        (instalada ? (
          <MensajeEstado tipo="exito" titulo="Ya la tiene en su pantalla de inicio">
            <p>Ábrala con un toque desde el ícono de la junta.</p>
          </MensajeEstado>
        ) : aviso ? (
          <Boton variante="secundario" icono={Smartphone} anchoCompleto onClick={instalar}>
            Agregar a mi pantalla de inicio
          </Boton>
        ) : (
          <div className="flex flex-col gap-3 rounded-control bg-fondo-suave p-4 senior:p-6">
            <p className="font-bold">Cómo agregarla</p>
            <p>En Android: toque el menú de los tres puntos y elija «Agregar a la pantalla principal».</p>
            <p>En iPhone: toque el botón Compartir y elija «Agregar a inicio».</p>
          </div>
        ))}

      <div className="flex flex-col gap-separacion">
        {ultimo ? (
          <BotonEnlace href="/" icono={ArrowRight} anchoCompleto>
            Terminar y empezar
          </BotonEnlace>
        ) : (
          <Boton icono={ArrowRight} anchoCompleto onClick={siguiente}>
            Siguiente
          </Boton>
        )}
        {!ultimo && (
          <Link
            href="/"
            className="inline-flex min-h-tactil items-center justify-center gap-2 font-bold text-texto-enlace"
          >
            <Pause aria-hidden className="size-icono" />
            Pausar y seguir después
          </Link>
        )}
        <Link
          href="/"
          className="inline-flex min-h-tactil items-center justify-center font-bold text-texto-enlace"
        >
          Saltar la guía (no se volverá a mostrar)
        </Link>
      </div>
    </div>
  );
}
