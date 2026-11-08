import { DoorOpen, House, type LucideIcon, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";
import { type ClavePerfil, perfilesParaCambiar } from "@/modulos/identidad/aplicacion/perfiles";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

// Pasar del perfil de equipo al de vecino (y de vuelta) sin cerrar sesión (HU-GAR-21). Si la persona tiene
// un solo perfil, no muestra nada. En el inicio va como el selector de dos vistas del prototipo (C-16, "Mi casa" y
// el rol), apilado en vista grande; en "Más" va como tarjeta.
const VISTAS: Record<ClavePerfil, { texto: string; Icono: LucideIcon }> = {
  vecino: { texto: "Mi casa", Icono: House },
  directiva: { texto: "Directiva", Icono: Users },
  administracion: { texto: "Administración", Icono: ShieldCheck },
  garita: { texto: "Garita", Icono: DoorOpen },
};

const OPCION =
  "flex min-h-tactil min-w-0 items-center justify-center gap-2 rounded-pastilla px-2 text-center text-base font-bold leading-titulo no-underline senior:max-lg:rounded-tarjeta";

export function CambiarDePerfil({
  sesion,
  actual,
  estilo,
}: {
  sesion: SesionDto;
  actual: ClavePerfil;
  estilo: "tarjeta" | "boton";
}) {
  const perfiles = perfilesParaCambiar(sesion.roles, actual);
  if (!perfiles.length) return null;
  if (estilo === "boton") {
    const { texto, Icono } = VISTAS[actual];
    return (
      <div
        role="group"
        aria-label="Cambiar de vista"
        className="grid grid-cols-2 gap-separacion rounded-pastilla border border-borde-control bg-fondo-suave p-1 senior:max-lg:grid-cols-1 senior:max-lg:rounded-tarjeta"
      >
        <span
          aria-current="true"
          className={`${OPCION} bg-accion-primaria text-texto-invertido shadow-tarjeta`}
        >
          <Icono aria-hidden className="size-icono shrink-0" />
          {texto}
        </span>
        {perfiles.map((p) => {
          const vista = VISTAS[p.clave];
          return (
            <Link
              key={p.clave}
              href={p.href}
              className={`${OPCION} text-accion-primaria hover:bg-accion-secundaria-hover`}
            >
              <vista.Icono aria-hidden className="size-icono shrink-0" />
              {vista.texto}
              <span className="sr-only"> (Pasar a {p.etiqueta.toLowerCase()})</span>
            </Link>
          );
        })}
      </div>
    );
  }
  return (
    <>
      {perfiles.map((p) => (
        <TarjetaEnlace key={p.clave} href={p.href} titulo={p.etiqueta}>
          <span>{p.descripcion}</span>
        </TarjetaEnlace>
      ))}
    </>
  );
}
