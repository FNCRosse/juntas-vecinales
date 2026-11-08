// @HU-COB-13
import { CircleCheck } from "lucide-react";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { soles } from "@/compartido/dinero";
import type { TableroDto } from "@/modulos/aportes/aplicacion/tablero";

/** La comprobación de que lo cobrado cuadra con los recibos (HU-COB-13 CA3), con las mismas palabras en el resumen y en el tablero. */
export function Cuadre({ t, enLinea = false }: { t: TableroDto; enLinea?: boolean }) {
  if (!t.cuadra.ok) {
    return (
      <MensajeEstado tipo="error" titulo="No cuadra">
        <p>
          Los recibos suman {soles(t.cuadra.recibos)} y los pagos aprobados, {soles(t.cuadra.pagos)}.
          {t.cuadra.pagosSinRecibo > 0 &&
            ` Hay ${t.cuadra.pagosSinRecibo} ${t.cuadra.pagosSinRecibo === 1 ? "pago aprobado" : "pagos aprobados"} sin recibo.`}{" "}
          Avise a la administración.
        </p>
      </MensajeEstado>
    );
  }
  const texto =
    t.recibos === 0
      ? "Todavía no hay recibos emitidos en este periodo."
      : `La suma de ${t.recibos === 1 ? "el recibo emitido" : `los ${t.recibos} recibos emitidos`} (${soles(t.digital.monto)} digitales + ${soles(t.efectivo.monto)} en efectivo) es igual a lo cobrado.`;
  // En el resumen (prototipo DIN01) va en una línea, sin caja.
  if (enLinea)
    return (
      <p className="flex items-start gap-2">
        <CircleCheck aria-hidden className="size-icono shrink-0 text-texto-exito" />
        <span>
          <strong>Cuadra.</strong> {texto}
        </span>
      </p>
    );
  return (
    <MensajeEstado tipo="exito" titulo="Cuadra">
      <p>{texto}</p>
    </MensajeEstado>
  );
}
