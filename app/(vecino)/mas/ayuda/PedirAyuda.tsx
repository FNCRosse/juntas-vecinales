"use client";
// @HU-ACC-04

import { Clock, House, LifeBuoy } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { fechaYHora } from "@/compartido/fechas";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";

type Enviado = {
  numero: string;
  pantalla: string;
  fecha: string;
  estadoTexto: string;
  atiende: string | null;
  promesa: string;
};

export function PedirAyuda({
  quien,
  telefonoTerminadoEn,
  pantalla,
  modos,
}: {
  quien: string;
  telefonoTerminadoEn: string | null;
  pantalla: string;
  modos: { modo: string; opcion: string }[];
}) {
  const [modo, setModo] = useState("LLAMADA");
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<Enviado | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (enviado) titulo.current?.focus();
  }, [enviado]);

  async function pedir(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<Enviado>("/api/accesibilidad/mediacion", "POST", { pantalla, modo, detalle });
    setEnviando(false);
    if (r.ok) setEnviado(r.datos);
    else setFalla(r.error);
  }

  if (enviado) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado
          tipo="exito"
          titulo={
            enviado.atiende
              ? `Pedido enviado a ${enviado.atiende}, de la directiva`
              : "Pedido enviado a la directiva"
          }
        >
          <p>Una persona de la directiva {enviado.promesa}.</p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Ya pedimos ayuda por usted
        </h1>
        <section className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta">
          <span className="text-texto-secundario">Pedido N.° {enviado.numero}</span>
          <strong>Ayuda en: {enviado.pantalla}</strong>
          <span>{fechaYHora(new Date(enviado.fecha))}</span>
          <span className="inline-flex items-center gap-2 font-bold text-texto-aviso">
            <Clock aria-hidden className="size-icono-pequeno" />
            {enviado.estadoTexto}
          </span>
        </section>
        <p>
          Puede seguir usando la app mientras tanto. Verá el estado de su pedido en Ayuda y accesibilidad.
        </p>
        <BotonEnlace href="/" icono={House}>
          Volver al inicio
        </BotonEnlace>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={pedir} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Pedir ayuda a una persona</h1>
        <p>
          Una persona de la directiva se comunicará con usted. No tiene que explicar todo: ya sabemos dónde
          estaba.
        </p>
      </div>
      <dl className="flex flex-col gap-2 rounded-control bg-fondo-suave p-4 senior:p-6">
        <div>
          <dt className="inline font-bold">Quién pide: </dt>
          <dd className="inline">{quien}</dd>
        </div>
        {telefonoTerminadoEn && (
          <div>
            <dt className="inline font-bold">Teléfono: </dt>
            <dd className="inline">terminado en {telefonoTerminadoEn}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-bold">Estaba en: </dt>
          <dd className="inline">{pantalla}</dd>
        </div>
      </dl>
      <GrupoOpciones id="campo-modo" pregunta="¿Cómo prefiere que le ayuden?">
        {modos.map(({ modo: clave, opcion }) => (
          <Opcion
            key={clave}
            tipo="radio"
            name="modo"
            etiqueta={opcion}
            checked={modo === clave}
            onChange={() => setModo(clave)}
          />
        ))}
      </GrupoOpciones>
      <div className="flex flex-col gap-3">
        <label htmlFor="campo-detalle" className="font-bold">
          ¿Algo más que quiera contarnos? (opcional)
        </label>
        <textarea
          id="campo-detalle"
          rows={3}
          maxLength={500}
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          className="w-full rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie p-3 text-base text-texto-principal hover:border-borde-fuerte"
        />
      </div>
      {falla && (
        <MensajeEstado tipo="error" titulo="No pudimos enviar su pedido">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={LifeBuoy} anchoCompleto cargando={enviando}>
        Pedir ayuda
      </Boton>
    </form>
  );
}
