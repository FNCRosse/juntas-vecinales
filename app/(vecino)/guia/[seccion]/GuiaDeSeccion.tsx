"use client";
// @HU-ACC-10

import { ArrowRight, Hand, Pause } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import type { GuiaDto } from "@/modulos/accesibilidad/aplicacion/guias";

// Un paso a la vez, con una sola acción resaltada (CA1); se puede pausar, saltar o terminar, y queda
// guardado en la cuenta (CA2, CA3).
export function GuiaDeSeccion({ guia, pasoInicial }: { guia: GuiaDto; pasoInicial: number }) {
  const router = useRouter();
  const [paso, setPaso] = useState(pasoInicial);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  const total = guia.pasos.length;
  const ultimo = paso === total - 1;
  const actual = guia.pasos[paso];

  const guardar = (accion: string, alPaso = paso) =>
    enviarJson("/api/accesibilidad/onboarding", "POST", { seccion: guia.seccion, accion, paso: alPaso });

  useEffect(() => {
    void guardar("avanzar", paso);
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
    // Se guarda cada paso que se ve; `guardar` cambia en cada render y no debe repetir la llamada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);

  async function salir(accion: "pausar" | "omitir" | "completar") {
    await guardar(accion);
    router.push(guia.href);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">
          Guía de {guia.nombre} · paso {paso + 1} de {total} · es opcional
        </p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {actual.titulo}
        </h1>
      </div>
      <p>{actual.texto}</p>
      <div className="flex flex-col gap-2 rounded-control border-(length:--borde-ancho-control) border-accion-primaria bg-fondo-suave p-4 senior:p-6">
        <span className="inline-flex items-center gap-2 text-pequeno font-bold">
          <Hand aria-hidden className="size-icono-pequeno" />
          Lo que va a tocar
        </span>
        <strong className="text-titulo-3">{actual.accion}</strong>
      </div>
      <div className="flex flex-col gap-separacion">
        {ultimo ? (
          <Boton icono={ArrowRight} anchoCompleto onClick={() => void salir("completar")}>
            {`Terminar e ir a ${guia.nombre}`}
          </Boton>
        ) : (
          <Boton icono={ArrowRight} anchoCompleto onClick={() => setPaso(paso + 1)}>
            Siguiente
          </Boton>
        )}
        {!ultimo && (
          <Boton variante="secundario" icono={Pause} anchoCompleto onClick={() => void salir("pausar")}>
            Pausar y seguir después
          </Boton>
        )}
        <button
          type="button"
          onClick={() => void salir("omitir")}
          className="inline-flex min-h-tactil items-center justify-center font-bold text-texto-enlace underline underline-offset-4 cursor-pointer"
        >
          Saltar la guía (no se volverá a mostrar)
        </button>
      </div>
      <p className="text-texto-secundario">Puede volver a verla en Más, en «Ayuda y accesibilidad».</p>
    </div>
  );
}
