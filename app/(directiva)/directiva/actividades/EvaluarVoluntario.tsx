"use client";
// @HU-ASA-09

import { BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { Dialogo } from "@/componentes/a11y/Dialogo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

// DIR-ASA-12: «No por ahora» y «Aprobar la ayuda». Aprobar abre una hoja para registrar el rol que tendrá (HU-ASA-09
// CA2). «No por ahora» no cierra la puerta (la casa todavía puede pagar) y aprobar es lo que la ayuda pide, así que
// las dos decisiones se aplican directas, sin paso de confirmación (R-12).
export function EvaluarVoluntario({ voluntariadoId, nombre }: { voluntariadoId: string; nombre: string }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [rol, setRol] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [falla, setFalla] = useState<string | null>(null);

  async function enviar(decision: "APROBAR" | "NO_APROBAR") {
    setEnviando(true);
    setFalla(null);
    setError(undefined);
    const r = await enviarJson(`/api/eventos/voluntariado/${voluntariadoId}`, "PATCH", { decision, rol });
    setEnviando(false);
    if (r.ok) {
      setAbierta(false);
      return router.refresh();
    }
    if (r.estado === 400 && r.campos.rol) setError(r.campos.rol);
    else setFalla(r.error);
  }

  return (
    <div className="flex flex-col gap-3">
      {falla && (
        <MensajeEstado tipo="error" titulo="No se pudo guardar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="button" variante="secundario" cargando={enviando} onClick={() => enviar("NO_APROBAR")}>
        No por ahora
      </Boton>
      <Dialogo
        variante="hoja"
        titulo={`Aprobar la ayuda de ${nombre}`}
        abierto={abierta}
        alCambiar={setAbierta}
        disparador={
          <Boton type="button" icono={BadgeCheck}>
            Aprobar la ayuda
          </Boton>
        }
      >
        <p>Registre el rol que tendrá. Le avisaremos que no paga la colaboración.</p>
        <Campo
          name="rol"
          etiqueta="Rol que tendrá"
          autoComplete="off"
          maxLength={80}
          ayuda="Por ejemplo: Cocina o Mesa de la entrada."
          value={rol}
          error={error}
          onChange={(e) => setRol(e.target.value)}
        />
        <Boton
          type="button"
          icono={BadgeCheck}
          anchoCompleto
          cargando={enviando}
          onClick={() => enviar("APROBAR")}
        >
          Aprobar la ayuda
        </Boton>
      </Dialogo>
    </div>
  );
}
