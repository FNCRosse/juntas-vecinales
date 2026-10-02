"use client";
// @HU-GAR-07

import { Search, Send } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, clasesBoton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { EnlaceLlego } from "./EnlaceLlego";

type Coincidencia = { id: string; nombre: string; vivienda: string; cuando: string; vehiculo: string };

export function BuscarVisita() {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string>();
  const [falla, setFalla] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<{ texto: string; coincidencias: Coincidencia[] } | null>(null);

  async function buscar(evento: FormEvent) {
    evento.preventDefault();
    if (texto.trim().length < 2) return setError("Escriba el nombre o el DNI de la visita.");
    setError(undefined);
    setFalla(null);
    setBuscando(true);
    const r = await enviarJson<{ coincidencias: Coincidencia[] }>(
      `/api/garita/visitas/verificar?${new URLSearchParams({ texto })}`,
      "GET",
    );
    setBuscando(false);
    if (r.ok) setResultado({ texto: texto.trim(), coincidencias: r.datos.coincidencias });
    else setFalla(r.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <form noValidate onSubmit={buscar} className="flex flex-col gap-4 md:flex-row md:items-end">
        <Campo
          name="visita"
          etiqueta="Nombre o DNI de la visita"
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
      {falla && (
        <MensajeEstado tipo="error" titulo="No se pudo buscar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      {resultado &&
        (resultado.coincidencias.length ? (
          <section aria-label="Visitas encontradas" className="flex flex-col gap-4">
            <MensajeEstado
              tipo="exito"
              titulo={
                resultado.coincidencias.length === 1
                  ? "Está en la lista de visitas anunciadas"
                  : `${resultado.coincidencias.length} visitas coinciden`
              }
            />
            <ul className="flex flex-col gap-4">
              {resultado.coincidencias.map((c) => (
                <li key={c.id} className="flex flex-col gap-2">
                  <strong>{c.nombre}</strong>
                  <span>
                    Para {c.vivienda} · {c.cuando} · {c.vehiculo}
                  </span>
                  <EnlaceLlego id={c.id} nombre={c.nombre} />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <MensajeEstado tipo="aviso" titulo={`${resultado.texto} no está en la lista de visitas`}>
            <p>Pregunte a la casa si la deja pasar. Lo que escribió ya queda anotado.</p>
            <Link
              href={`/garita/visitas/nueva?${new URLSearchParams(
                /^\d{8}$/.test(resultado.texto) ? { dni: resultado.texto } : { nombre: resultado.texto },
              )}`}
              className={`${clasesBoton("primario")} self-start`}
            >
              <Send aria-hidden className="size-icono shrink-0" />
              <span>Preguntar al vecino</span>
            </Link>
          </MensajeEstado>
        ))}
    </div>
  );
}
