import type { ReactNode } from "react";

/**
 * Título de una pantalla con su acción principal (crear, agregar, registrar). En el teléfono y la tablet la acción
 * va debajo del título, a ancho completo; en el escritorio va al costado, a la derecha.
 */
export function EncabezadoPagina({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">{titulo}</h1>
        {descripcion && <p className="text-texto-secundario">{descripcion}</p>}
      </div>
      {accion && <div className="lg:shrink-0">{accion}</div>}
    </div>
  );
}
