"use client";
// @HU-ASA-07

import { Check, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";

type Resultado = {
  predioId: string;
  nombre: string;
  vivienda: string;
  dniTerminadoEn: string;
  presente: boolean;
};

// DIR-ASA-09: «Van llegando». El mediador busca por nombre o DNI y marca a quien llega; marcar a alguien
// presente se puede corregir en el momento (es un registro del día, no una baja), así que va directo (R-12).
export function MarcarPresentes({ asambleaId }: { asambleaId: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [falla, setFalla] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);

  async function buscar() {
    setFalla(null);
    const r = await enviarJson<Resultado[]>(
      `/api/asambleas/${asambleaId}/checkin?q=${encodeURIComponent(texto)}`,
      "GET",
    );
    if (r.ok) setResultados(r.datos);
    else setFalla(r.error);
  }

  async function marcar(predioId: string) {
    setTrabajando(predioId);
    setFalla(null);
    const r = await enviarJson(`/api/asambleas/${asambleaId}/checkin`, "POST", { predioId });
    setTrabajando(null);
    if (!r.ok) return setFalla(r.error);
    await buscar();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
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
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Boton type="submit" icono={Search} variante="secundario">
          Buscar
        </Boton>
      </form>
      {falla && (
        <MensajeEstado tipo="aviso" titulo="No se pudo marcar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      {resultados && resultados.length === 0 && (
        <p>No encontramos a ese vecino. Revise el nombre o escriba el DNI.</p>
      )}
      {resultados && resultados.length > 0 && (
        <ListaVerMas
          etiqueta="Vecinos encontrados"
          normal={3}
          senior={1}
          elementos={resultados.map((v) => (
            <div
              key={v.predioId}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <p className="font-bold">{v.nombre}</p>
              <p className="text-texto-secundario">
                {v.vivienda} · DNI terminado en {v.dniTerminadoEn}
              </p>
              {v.presente ? (
                <p className="inline-flex items-center gap-2 font-bold text-texto-exito">
                  <Check aria-hidden className="size-icono" />
                  Presente
                </p>
              ) : (
                <Boton
                  type="button"
                  icono={Check}
                  cargando={trabajando === v.predioId}
                  onClick={() => marcar(v.predioId)}
                >
                  Marcar presente
                </Boton>
              )}
            </div>
          ))}
        />
      )}
    </div>
  );
}
