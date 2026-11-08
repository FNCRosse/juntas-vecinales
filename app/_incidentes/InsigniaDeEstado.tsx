import { CircleCheck, CircleX, Info, type LucideIcon, TriangleAlert } from "lucide-react";
import { Insignia, type TonoInsignia } from "@/componentes/a11y/Insignia";
import type { MapaDto } from "@/modulos/incidencias/aplicacion/mapa";

// El estado de un reporte con el color del prototipo (VEC-QUE-01): en revisión en ámbar, resuelto en verde,
// no procede en rojo; recibido y derivado, informativos. Siempre con ícono y texto (WCAG 1.4.1).

type EstadoReporte = MapaDto["recientes"][number]["clave"];

const ESTILO: Record<EstadoReporte, { tono: TonoInsignia; icono: LucideIcon }> = {
  RECIBIDO: { tono: "info", icono: Info },
  EN_REVISION: { tono: "aviso", icono: TriangleAlert },
  RECHAZADO: { tono: "error", icono: CircleX },
  RESUELTO: { tono: "exito", icono: CircleCheck },
  DERIVADO_ENTIDAD_EXTERNA: { tono: "info", icono: Info },
};

export function InsigniaDeEstado({ estado, texto }: { estado: EstadoReporte; texto: string }) {
  const { tono, icono } = ESTILO[estado];
  return (
    <Insignia tono={tono} icono={icono}>
      {texto}
    </Insignia>
  );
}
