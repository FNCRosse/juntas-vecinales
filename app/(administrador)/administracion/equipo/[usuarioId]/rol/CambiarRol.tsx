"use client";
// @HU-GAR-23

import { ArrowRight, ChevronLeft, CircleMinus, CirclePlus, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import type { RolEquipo } from "@/modulos/identidad/aplicacion/equipo";

type Opcion = { rol: RolEquipo; nombre: string; gana: string[]; pierde: string[]; mantiene: string[] };

function Lista({ titulo, permisos, Icono }: { titulo: string; permisos: string[]; Icono: typeof Check }) {
  if (!permisos.length) return null;
  return (
    <>
      <h3 className="font-bold">{titulo}</h3>
      <ul className="flex flex-col gap-2">
        {permisos.map((p) => (
          <li key={p} className="flex items-start gap-2">
            <Icono aria-hidden className="size-icono shrink-0" />
            {p}
          </li>
        ))}
      </ul>
    </>
  );
}

export function CambiarRol({
  miembro,
  opciones,
}: {
  miembro: { id: string; nombre: string; rol: RolEquipo; rolTexto: string };
  opciones: Opcion[];
}) {
  const [paso, setPaso] = useState<"elegir" | "confirmar">("elegir");
  const [nuevo, setNuevo] = useState<RolEquipo>(miembro.rol);
  const [aviso, setAviso] = useState<string | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const elegida = opciones.find((o) => o.rol === nuevo) ?? opciones[0];
  const igual = nuevo === miembro.rol;

  async function confirmar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ nombre: string; rolTexto: string }>(
      `/api/admin/cuentas/${miembro.id}/rol`,
      "PATCH",
      {
        rol: nuevo,
      },
    );
    if (r.ok) {
      const aviso = new URLSearchParams({ aviso: "rol", nombre: r.datos.nombre, rol: r.datos.rolTexto });
      router.push(`/administracion/equipo?${aviso}`);
      return;
    }
    setEnviando(false);
    setFalla(r.error);
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={`¿Desea cambiar el rol de ${miembro.nombre}?`}
        filas={[
          ["Persona", miembro.nombre],
          ["Rol actual", miembro.rolTexto],
          ["Rol nuevo", elegida.nombre],
          ["Gana", elegida.gana.join("; ") || "Nada"],
          ["Pierde", elegida.pierde.join("; ") || "Nada"],
        ]}
        efecto="Sus permisos cambian al momento, con la misma cuenta. Le avisaremos por WhatsApp."
        textoConfirmar="Sí, cambiar el rol"
        enviando={enviando}
        error={falla}
        alConfirmar={confirmar}
        alCorregir={() => setPaso("elegir")}
        hrefCancelar="/administracion/equipo"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/administracion/equipo"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a cuentas del equipo
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Cambiar el rol de {miembro.nombre}
        </h1>
        <p>Hoy es {miembro.rolTexto}. No hace falta crear otra cuenta.</p>
      </div>
      <GrupoOpciones id="campo-rol" pregunta="Rol nuevo">
        {opciones.map((o) => (
          <Opcion
            key={o.rol}
            tipo="radio"
            name="rol"
            etiqueta={o.nombre}
            checked={nuevo === o.rol}
            onChange={() => {
              setNuevo(o.rol);
              setAviso(null);
            }}
          />
        ))}
      </GrupoOpciones>
      <section
        aria-labelledby="titulo-cambios"
        className="flex flex-col gap-3 rounded-control bg-fondo-suave p-4 senior:p-6"
      >
        <h2 id="titulo-cambios" className="flex items-center gap-2 text-titulo-3">
          <ShieldCheck aria-hidden className="size-icono" />
          Qué cambia en sus permisos
        </h2>
        {igual ? (
          <p>Es el mismo rol que tiene hoy: no cambia nada.</p>
        ) : (
          <>
            <Lista titulo="Podrá hacer desde ahora" permisos={elegida.gana} Icono={CirclePlus} />
            <Lista titulo="Ya no podrá" permisos={elegida.pierde} Icono={CircleMinus} />
            <Lista titulo="Sigue pudiendo" permisos={elegida.mantiene} Icono={Check} />
          </>
        )}
      </section>
      {aviso && (
        <MensajeEstado tipo="info" titulo="Es el mismo rol">
          <p>{aviso}</p>
        </MensajeEstado>
      )}
      <Boton
        icono={ArrowRight}
        anchoCompleto
        onClick={() => (igual ? setAviso("Elija otro rol para cambiarlo.") : setPaso("confirmar"))}
      >
        Revisar el cambio
      </Boton>
    </div>
  );
}
