import { ArrowLeftRight } from "lucide-react";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";
import { type ClavePerfil, perfilesParaCambiar } from "@/modulos/identidad/aplicacion/perfiles";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

// Pasar del perfil de equipo al de vecino (y de vuelta) sin cerrar sesión (HU-GAR-21). Si la persona tiene
// un solo perfil, no muestra nada.
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
  return (
    <>
      {perfiles.map((p) =>
        estilo === "tarjeta" ? (
          <TarjetaEnlace key={p.clave} href={p.href} titulo={p.etiqueta}>
            <span>{p.descripcion}</span>
          </TarjetaEnlace>
        ) : (
          <BotonEnlace key={p.clave} href={p.href} variante="secundario" icono={ArrowLeftRight}>
            Pasar a {p.etiqueta.toLowerCase()}
          </BotonEnlace>
        ),
      )}
    </>
  );
}
