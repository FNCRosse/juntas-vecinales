"use client";
// @HU-GAR-07

import { ChevronLeft, Send, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";

type Casa = { predioId: string; titular: string; vivienda: string };
const MAXIMO_VISIBLES = 5;

/** VIG-VIS-03: la visita no está en la lista; se anota lo que falta y se pregunta a la casa. */
export function PreguntarAlVecino({ nombre, dni }: { nombre: string; dni: string }) {
  const router = useRouter();
  const [datos, setDatos] = useState({ nombre, dni, motivo: "", conVehiculo: false, placa: "" });
  const [busquedaCasa, setBusquedaCasa] = useState("");
  const [casas, setCasas] = useState<Casa[] | null>(null);
  const [casa, setCasa] = useState<Casa | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Busca la casa mientras se escribe, con una pausa corta para no pedir en cada tecla.
  useEffect(() => {
    const texto = busquedaCasa.trim();
    if (!texto) return;
    const espera = setTimeout(async () => {
      const r = await enviarJson<{ casas: Casa[] }>(
        `/api/garita/casas?${new URLSearchParams({ texto })}`,
        "GET",
      );
      if (r.ok) setCasas(r.datos.casas);
    }, 300);
    return () => clearTimeout(espera);
  }, [busquedaCasa]);

  async function preguntar(evento: FormEvent) {
    evento.preventDefault();
    setFalla(null);
    const faltan: Record<string, string> = {};
    if (!datos.nombre.trim()) faltan.nombre = "Falta el nombre de la visita.";
    if (!casa) faltan.casa = "Elija a qué casa va.";
    if (!datos.motivo.trim()) faltan.motivo = "Escriba a qué viene.";
    setErrores(faltan);
    if (Object.keys(faltan).length || !casa) return;
    setEnviando(true);
    const r = await enviarJson<{ id: string }>("/api/garita/visitas/preguntas", "POST", {
      ...datos,
      predioId: casa.predioId,
      dni: datos.dni || undefined,
      placa: datos.conVehiculo ? datos.placa : undefined,
    });
    if (r.ok) return router.push(`/garita/visitas/${r.datos.id}`);
    setEnviando(false);
    if (r.estado === 400 && Object.keys(r.campos).length) {
      const { predioId, ...resto } = r.campos;
      setErrores(predioId ? { ...resto, casa: predioId } : resto);
    } else setFalla(r.error);
  }

  const visibles = casas?.slice(0, MAXIMO_VISIBLES) ?? [];
  const cuenta =
    casas === null
      ? ""
      : casas.length === 0
        ? "Ninguna casa coincide."
        : casas.length > MAXIMO_VISIBLES
          ? `Se muestran ${MAXIMO_VISIBLES} de ${casas.length} casas. Escriba más para acotar.`
          : casas.length === 1
            ? "1 casa encontrada."
            : `${casas.length} casas encontradas.`;
  const listaErrores = Object.entries(errores).map(([campo, mensaje]) => ({
    campo: `campo-${campo}`,
    mensaje,
  }));

  return (
    <form noValidate onSubmit={preguntar} className="flex flex-col gap-6">
      <Link
        href="/garita/visitas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a visitas
      </Link>
      <p className="inline-flex items-center gap-2 self-start rounded-control bg-fondo-aviso px-3 py-2 font-bold">
        <TriangleAlert aria-hidden className="size-icono shrink-0 text-texto-aviso" />
        No está en la lista de visitas
      </p>
      <div className="flex flex-col gap-2">
        <span className="text-texto-secundario">Paso 1 de 2</span>
        <h1 className="text-titulo-1">Preguntar al vecino si la deja pasar</h1>
        <p>Lo que escribió al buscar ya está aquí. Complete solo lo que falta.</p>
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
        etiqueta="DNI (opcional)"
        inputMode="numeric"
        maxLength={8}
        autoComplete="off"
        value={datos.dni}
        error={errores.dni}
        onChange={(e) => setDatos({ ...datos, dni: e.target.value.replace(/\D/g, "").slice(0, 8) })}
      />
      <GrupoOpciones id="campo-casa" pregunta="¿A qué casa va?" error={errores.casa}>
        <Campo
          name="buscar-casa"
          etiqueta="Busque por nombre del vecino, manzana o lote"
          type="search"
          autoComplete="off"
          aria-controls="casas-encontradas"
          value={busquedaCasa}
          onChange={(e) => setBusquedaCasa(e.target.value)}
        />
        <span role="status" className="text-texto-secundario">
          {cuenta}
        </span>
        <div id="casas-encontradas" className="flex flex-col gap-separacion">
          {visibles.map((c) => (
            <Opcion
              key={c.predioId}
              tipo="radio"
              name="casa"
              etiqueta={`${c.titular} · ${c.vivienda}`}
              checked={casa?.predioId === c.predioId}
              onChange={() => setCasa(c)}
            />
          ))}
          {casa && !visibles.some((c) => c.predioId === casa.predioId) && (
            <Opcion
              tipo="radio"
              name="casa"
              etiqueta={`${casa.titular} · ${casa.vivienda}`}
              checked
              readOnly
            />
          )}
        </div>
        {casas?.length === 0 && (
          <p>
            No encontramos esa casa. Pruebe con el apellido o escriba solo la manzana, por ejemplo «Mz. C».
          </p>
        )}
      </GrupoOpciones>
      <Campo
        name="motivo"
        etiqueta="¿A qué viene?"
        autoComplete="off"
        value={datos.motivo}
        error={errores.motivo}
        onChange={(e) => setDatos({ ...datos, motivo: e.target.value })}
      />
      <GrupoOpciones id="campo-conVehiculo" pregunta="¿Cómo llegó?">
        <Opcion
          tipo="radio"
          name="llego"
          etiqueta="A pie"
          checked={!datos.conVehiculo}
          onChange={() => setDatos({ ...datos, conVehiculo: false })}
        />
        <Opcion
          tipo="radio"
          name="llego"
          etiqueta="En auto o moto"
          checked={datos.conVehiculo}
          onChange={() => setDatos({ ...datos, conVehiculo: true })}
        />
      </GrupoOpciones>
      {datos.conVehiculo && (
        <Campo
          name="placa"
          etiqueta="Placa"
          autoComplete="off"
          maxLength={8}
          value={datos.placa}
          error={errores.placa}
          onChange={(e) => setDatos({ ...datos, placa: e.target.value.toUpperCase() })}
        />
      )}
      {falla && (
        <MensajeEstado tipo="error" titulo="No se envió la pregunta">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={Send} anchoCompleto cargando={enviando}>
        {casa ? `Preguntar a ${casa.titular}` : "Preguntar a la casa"}
      </Boton>
      <p className="text-texto-secundario">
        Le llegará un aviso en la app y por WhatsApp. También puede llamar a la casa.
      </p>
    </form>
  );
}
