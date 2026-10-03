// @HU-QUE-05 @HU-QUE-07 @HU-QUE-09
import { CircleCheck, CircleDashed, Clock, FileText, Info } from "lucide-react";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import type { AvanceDto } from "@/modulos/incidencias/aplicacion/seguimiento";

// VEC-QUE-08: el avance de un reporte en tres pasos, con el estado escrito en cada uno (no solo color).
// Sirve con sesión (Mis reportes) y sin ella (buscar con el código).

const ICONO = {
  hecho: { Icono: CircleCheck, clase: "text-texto-exito", texto: "Hecho" },
  ahora: { Icono: Clock, clase: "text-texto-aviso", texto: "Sigue ahora" },
  pendiente: { Icono: CircleDashed, clase: "text-texto-secundario", texto: "Todavía no" },
} as const;

export function AvanceReporte({
  avance,
  hrefOficio,
  nivel = 1,
}: {
  avance: AvanceDto;
  /** Dónde descargar el oficio si el reporte se derivó (HU-QUE-07 CA3). */
  hrefOficio: string;
  nivel?: 1 | 2;
}) {
  const Titulo = nivel === 1 ? "h1" : "h2";
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Titulo tabIndex={-1} className="text-titulo-1">
          Reporte {avance.numero}
        </Titulo>
        <span className="text-texto-secundario">
          {avance.categoria} · {avance.lugar}
        </span>
        <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
          <Info aria-hidden className="size-icono-pequeno" />
          {avance.estadoTexto}
        </span>
      </div>
      {avance.novedad && (
        <MensajeEstado tipo={avance.novedad.tipo} titulo={avance.novedad.titulo}>
          <p>{avance.novedad.texto}</p>
        </MensajeEstado>
      )}
      <ol aria-label="Avance del reporte" className="flex flex-col gap-6">
        {avance.pasos.map((paso) => {
          const { Icono, clase, texto } = ICONO[paso.estado];
          return (
            <li key={paso.titulo} className="flex gap-3">
              <Icono aria-hidden className={`size-icono shrink-0 ${clase}`} />
              <span className="flex flex-col gap-1">
                <strong>{paso.titulo}</strong>
                <span>{paso.texto}</span>
                <span className={`text-pequeno font-bold ${clase}`}>{texto}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {avance.oficio && (
        <a
          href={hrefOficio}
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <FileText aria-hidden className="size-icono" />
          Descargar el oficio {avance.oficio.oficio} (PDF)
        </a>
      )}
      <p>
        Le avisaremos aquí y por WhatsApp cada vez que cambie. Por su seguridad, aquí no mostramos datos de
        otras personas.
      </p>
    </div>
  );
}
