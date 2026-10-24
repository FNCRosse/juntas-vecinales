// @HU-COB-13
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { soles } from "@/compartido/dinero";
import type { TableroDto } from "@/modulos/aportes/aplicacion/tablero";

/** La comprobación de que lo cobrado cuadra con los recibos (HU-COB-13 CA3), con las mismas palabras en el resumen y en el tablero. */
export function Cuadre({ t }: { t: TableroDto }) {
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
  return (
    <MensajeEstado tipo="exito" titulo="Cuadra">
      <p>
        {t.recibos === 0
          ? "Todavía no hay recibos emitidos en este periodo."
          : `La suma de ${t.recibos === 1 ? "el recibo emitido" : `los ${t.recibos} recibos emitidos`} (${soles(t.digital.monto)} digitales + ${soles(t.efectivo.monto)} en efectivo) es igual a lo cobrado.`}
      </p>
    </MensajeEstado>
  );
}
