"use client";
// @HU-GAR-23

import { ArrowRight, Check, ChevronLeft, CircleMinus, CirclePlus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import type { RolDeDirectiva } from "@/modulos/identidad/aplicacion/equipo";

type Combinacion = {
  roles: RolDeDirectiva[];
  rolTexto: string;
  gana: string[];
  pierde: string[];
  mantiene: string[];
};

const ROLES: { rol: RolDeDirectiva; nombre: string }[] = [
  { rol: "DIRECTIVA", nombre: "Directiva" },
  { rol: "DIRECTIVO_MEDIADOR", nombre: "Directivo mediador" },
];

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

const clave = (roles: RolDeDirectiva[]) => [...roles].sort().join();

export function CambiarRoles({
  miembro,
  combinaciones,
}: {
  miembro: {
    id: string;
    nombre: string;
    rolTexto: string;
    rolesDeDirectiva: RolDeDirectiva[];
    esUsted: boolean;
  };
  combinaciones: Combinacion[];
}) {
  const [paso, setPaso] = useState<"elegir" | "confirmar">("elegir");
  const [elegidos, setElegidos] = useState<RolDeDirectiva[]>(miembro.rolesDeDirectiva);
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

  const elegida = combinaciones.find((c) => clave(c.roles) === clave(elegidos)) ?? combinaciones[0];
  const igual = clave(elegidos) === clave(miembro.rolesDeDirectiva);

  async function confirmar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ nombre: string; rolTexto: string }>(
      `/api/admin/cuentas/${miembro.id}/roles`,
      "PATCH",
      { roles: elegidos },
    );
    if (r.ok) {
      const aviso = new URLSearchParams({ aviso: "roles", nombre: r.datos.nombre, rol: r.datos.rolTexto });
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
        titulo={
          miembro.esUsted ? "¿Desea cambiar sus roles?" : `¿Desea cambiar los roles de ${miembro.nombre}?`
        }
        filas={[
          ["Persona", miembro.nombre],
          ["Roles actuales", miembro.rolTexto],
          ["Roles nuevos", elegida.rolTexto],
          ["Gana", elegida.gana.join("; ") || "Nada"],
          ["Pierde", elegida.pierde.join("; ") || "Nada"],
        ]}
        efecto={
          miembro.esUsted
            ? "Sus permisos cambian al momento, con esta misma cuenta. Seguirá siendo administración."
            : "Sus permisos cambian al momento, con la misma cuenta. Seguirá siendo administración. Le avisaremos por WhatsApp."
        }
        textoConfirmar="Sí, cambiar los roles"
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
          {miembro.esUsted ? "Sus roles de directiva" : `Roles de directiva de ${miembro.nombre}`}
        </h1>
        <p>
          Hoy es {miembro.rolTexto}. Con estos roles puede hacer lo mismo que la directiva sin crear otra
          cuenta. La administración se mantiene siempre.
        </p>
      </div>
      <GrupoOpciones id="campo-roles" pregunta="Roles que se suman a la administración">
        {ROLES.map(({ rol, nombre }) => (
          <Opcion
            key={rol}
            tipo="checkbox"
            name="roles"
            etiqueta={nombre}
            checked={elegidos.includes(rol)}
            onChange={(e) => {
              setElegidos(e.target.checked ? [...elegidos, rol] : elegidos.filter((r) => r !== rol));
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
          <p>Son los mismos roles que tiene hoy: no cambia nada.</p>
        ) : (
          <>
            <Lista titulo="Podrá hacer desde ahora" permisos={elegida.gana} Icono={CirclePlus} />
            <Lista titulo="Ya no podrá" permisos={elegida.pierde} Icono={CircleMinus} />
            <Lista titulo="Sigue pudiendo" permisos={elegida.mantiene} Icono={Check} />
          </>
        )}
      </section>
      {aviso && (
        <MensajeEstado tipo="info" titulo="Son los mismos roles">
          <p>{aviso}</p>
        </MensajeEstado>
      )}
      <Boton
        icono={ArrowRight}
        anchoCompleto
        onClick={() => (igual ? setAviso("Marque o desmarque un rol para cambiarlo.") : setPaso("confirmar"))}
      >
        Revisar el cambio
      </Boton>
    </div>
  );
}
