"use client";
// @HU-ASA-03

import { Check, Search, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

type Resultado = {
  predioId: string;
  nombre: string;
  vivienda: string;
  dniTerminadoEn: string;
  confirmacion: { modo: "DIGITAL" | "ASISTIDA"; registradaPor: string | null } | null;
};

// DIR-ASA-06: el mediador busca al vecino y asienta su asistencia. Anular es posible solo con lo que
// él asentó, y el vecino sigue pudiendo confirmar por su cuenta (R-12: acción reversible, sin paso extra).
export function RegistrarAsistencia({ asambleaId }: { asambleaId: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);

  async function buscar() {
    setFalla(null);
    const r = await enviarJson<Resultado[]>(
      `/api/asambleas/${asambleaId}/asistencia/asistida?q=${encodeURIComponent(texto)}`,
      "GET",
    );
    if (r.ok) setResultados(r.datos);
    else setFalla(r.error);
  }

  async function cambiar(predioId: string, metodo: "POST" | "DELETE") {
    setTrabajando(predioId);
    setFalla(null);
    const r = await enviarJson(`/api/asambleas/${asambleaId}/asistencia/asistida`, metodo, { predioId });
    setTrabajando(null);
    if (!r.ok) return setFalla(r.error);
    await buscar();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void buscar();
        }}
        className="flex flex-col gap-3"
      >
        <Campo
          name="buscar"
          etiqueta="Buscar por nombre o DNI"
          autoComplete="off"
          ayuda="Ejemplo: Julia Torres o 08123456"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Boton type="submit" icono={Search} variante="secundario">
          Buscar
        </Boton>
      </form>
      {falla && (
        <MensajeEstado tipo="error" titulo="No se pudo guardar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      {resultados && resultados.length === 0 && (
        <p>No encontramos a ese vecino. Revise el nombre o escriba el DNI.</p>
      )}
      {resultados && resultados.length > 0 && (
        <ul className="flex flex-col gap-4" aria-label="Vecinos encontrados">
          {resultados.map((v) => (
            <li
              key={v.predioId}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <p className="font-bold">{v.nombre}</p>
              <p className="text-texto-secundario">
                {v.vivienda} · DNI terminado en {v.dniTerminadoEn}
              </p>
              {!v.confirmacion && (
                <>
                  <p>Todavía no confirma</p>
                  <Boton
                    type="button"
                    icono={Check}
                    cargando={trabajando === v.predioId}
                    onClick={() => cambiar(v.predioId, "POST")}
                  >
                    Registrar que asistirá
                  </Boton>
                </>
              )}
              {v.confirmacion?.modo === "ASISTIDA" && (
                <>
                  <p className="font-bold">Asistirá · gestionado en persona</p>
                  <Boton
                    type="button"
                    variante="secundario"
                    icono={Undo2}
                    cargando={trabajando === v.predioId}
                    onClick={() => cambiar(v.predioId, "DELETE")}
                  >
                    Anular este registro
                  </Boton>
                </>
              )}
              {v.confirmacion?.modo === "DIGITAL" && (
                <p className="font-bold">Asistirá · confirmó en la app</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
