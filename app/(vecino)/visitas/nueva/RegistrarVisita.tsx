"use client";
// @HU-GAR-04

import { ArrowLeft, Check, Users } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { fechaYHora } from "@/compartido/fechas";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";

type Registrada = {
  codigo: string;
  nombre: string;
  cuando: string;
  vehiculo: string;
  registradaEn: string;
  vivienda: string;
};

const hoyEnLima = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());

export function RegistrarVisita({ vivienda, nombre }: { vivienda: string; nombre: string }) {
  const [datos, setDatos] = useState({
    nombre: "",
    dni: "",
    fecha: "",
    hora: "",
    conVehiculo: false,
    placa: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [registrada, setRegistrada] = useState<Registrada | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (registrada) titulo.current?.focus();
  }, [registrada]);

  async function registrar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<Registrada>("/api/garita/visitas", "POST", {
      ...datos,
      placa: datos.conVehiculo ? datos.placa : undefined,
      dni: datos.dni || undefined,
    });
    setEnviando(false);
    if (r.ok) return setRegistrada(r.datos);
    if (r.estado === 400) {
      const campos = r.campos.desde ? { ...r.campos, fecha: r.campos.desde } : r.campos;
      delete campos.desde;
      setErrores(campos);
    } else setFalla(r.error);
  }

  if (registrada) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo={`Registrada el ${fechaYHora(new Date(registrada.registradaEn))}`}>
          <p>El vigilante ya la ve en la lista de la garita.</p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {registrada.nombre} puede entrar
        </h1>
        <section className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta">
          <span className="text-texto-secundario">Constancia de visita N.° {registrada.codigo}</span>
          <strong className="text-titulo-3">{registrada.cuando}</strong>
          <span>
            {registrada.vehiculo} · a {registrada.vivienda}
          </span>
        </section>
        <p>Si cambia de planes, puede anular la visita desde Mis visitas.</p>
        <BotonEnlace href="/visitas" icono={Users}>
          Volver a Mis visitas
        </BotonEnlace>
      </div>
    );
  }

  const listaErrores = Object.entries(errores).map(([campo, mensaje]) => ({
    campo: `campo-${campo}`,
    mensaje,
  }));
  return (
    <form noValidate onSubmit={registrar} className="flex flex-col gap-6">
      <Link
        href="/visitas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ArrowLeft aria-hidden className="size-icono" />
        Volver a Mis visitas
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Registrar una visita</h1>
        <p>
          Viene a: <strong>{vivienda}</strong> ({nombre}).
        </p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <Campo
        name="nombre"
        etiqueta="Nombre de la visita"
        autoComplete="off"
        value={datos.nombre}
        error={errores.nombre}
        onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
      />
      <Campo
        name="dni"
        etiqueta="Su DNI (opcional)"
        ayuda="Si lo sabe, ayuda al vigilante a reconocerla. Si no, puede dejarlo vacío."
        inputMode="numeric"
        maxLength={8}
        autoComplete="off"
        value={datos.dni}
        error={errores.dni}
        onChange={(e) => setDatos({ ...datos, dni: e.target.value.replace(/\D/g, "").slice(0, 8) })}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          name="fecha"
          etiqueta="Fecha"
          type="date"
          min={hoyEnLima()}
          value={datos.fecha}
          error={errores.fecha}
          onChange={(e) => setDatos({ ...datos, fecha: e.target.value })}
        />
        <Campo
          name="hora"
          etiqueta="Hora de llegada"
          ayuda="El permiso dura 3 horas desde esa hora."
          type="time"
          step={900}
          value={datos.hora}
          error={errores.hora}
          onChange={(e) => setDatos({ ...datos, hora: e.target.value })}
        />
      </div>
      <GrupoOpciones id="campo-conVehiculo" pregunta="¿Tiene vehículo?">
        <Opcion
          tipo="radio"
          name="vehiculo"
          etiqueta="No, viene a pie"
          checked={!datos.conVehiculo}
          onChange={() => setDatos({ ...datos, conVehiculo: false })}
        />
        <Opcion
          tipo="radio"
          name="vehiculo"
          etiqueta="Sí, viene en auto o moto"
          checked={datos.conVehiculo}
          onChange={() => setDatos({ ...datos, conVehiculo: true })}
        />
      </GrupoOpciones>
      {datos.conVehiculo && (
        <Campo
          name="placa"
          etiqueta="Placa del vehículo (opcional)"
          ayuda="Si no la sabe, el vigilante la anotará cuando llegue."
          autoComplete="off"
          maxLength={8}
          value={datos.placa}
          error={errores.placa}
          onChange={(e) => setDatos({ ...datos, placa: e.target.value.toUpperCase() })}
        />
      )}
      {falla && (
        <MensajeEstado tipo="error" titulo="No se registró la visita">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={Check} anchoCompleto cargando={enviando}>
        Registrar la visita
      </Boton>
    </form>
  );
}
