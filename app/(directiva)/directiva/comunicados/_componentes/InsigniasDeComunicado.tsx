import { History, Info, PencilLine, TriangleAlert } from "lucide-react";
import { Insignia } from "@/componentes/a11y/Insignia";
import type { NoticiaDto } from "@/modulos/transparencia/aplicacion/comunicados";

/** Urgencia y, si corresponde, «Corregido» o «Corrección»: siempre con ícono y palabra, nunca solo color (WCAG 1.4.1). */
export function InsigniasDeComunicado({ comunicado }: { comunicado: NoticiaDto }) {
  return (
    <span className="flex flex-wrap gap-2">
      {comunicado.urgencia === "URGENTE" ? (
        <Insignia tono="aviso" icono={TriangleAlert}>
          Urgente
        </Insignia>
      ) : (
        <Insignia tono="info" icono={Info}>
          Informativo
        </Insignia>
      )}
      {comunicado.corregidoPorId && (
        <Insignia tono="error" icono={History}>
          Corregido: ya no lo ven los vecinos
        </Insignia>
      )}
      {comunicado.corrigeAId && (
        <Insignia tono="exito" icono={PencilLine}>
          Corrección
        </Insignia>
      )}
    </span>
  );
}
