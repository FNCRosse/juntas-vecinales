"use client";

import { useState } from "react";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { Confirmacion } from "@/componentes/a11y/Confirmacion";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// Ejemplo de acción crítica con confirmación en dos pasos (HU-ACC-03): Cancelar no borra lo escrito.
export function DemoConfirmacion() {
  const [monto, setMonto] = useState("5.00");
  const [enviado, setEnviado] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Campo
        name="monto"
        etiqueta="Monto que pagó"
        ayuda="En soles. Por ejemplo: 5.00"
        inputMode="decimal"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
      />
      <Confirmacion
        disparador={<Boton anchoCompleto>Revisar y enviar mi comprobante</Boton>}
        titulo="Revise su pago antes de enviarlo"
        resumen={[
          { etiqueta: "Qué paga", valor: "Cuota semanal" },
          { etiqueta: "Monto", valor: `S/ ${monto}` },
          { etiqueta: "Para", valor: "Junta Vecinal · Mz. C, lote 7" },
        ]}
        aviso="Al enviarlo, la directiva revisará su comprobante. Si algo no está bien, puede corregirlo o cancelar ahora."
        textoConfirmar="Enviar mi comprobante"
        alConfirmar={() => setEnviado(true)}
      />
      {enviado && (
        <MensajeEstado tipo="exito" titulo="Recibimos su comprobante">
          <p>La directiva lo revisará. Le avisaremos por WhatsApp y en Avisos.</p>
        </MensajeEstado>
      )}
    </div>
  );
}
