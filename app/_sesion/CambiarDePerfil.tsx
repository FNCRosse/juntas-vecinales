import { ArrowLeftRight } from "lucide-react";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";
import { type ClavePerfil, perfilesParaCambiar } from "@/modulos/identidad/aplicacion/perfiles";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

// Pasar del perfil de equipo al de vecino (y de vuelta) sin cerrar sesión (HU-GAR-21). Si la persona tiene
// un solo perfil, no muestra nada. Los botones van con la separación del token y apilados en vista grande
// (R-03, prototipo: selector "Ver como").
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
  if (estilo === "boton")
    return (
      <div className="flex flex-col gap-separacion md:flex-row senior:flex-col">
        {perfiles.map((p) => (
          <BotonEnlace key={p.clave} href={p.href} variante="secundario" icono={ArrowLeftRight}>
            Pasar a {p.etiqueta.toLowerCase()}
          </BotonEnlace>
        ))}
      </div>
    );
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
