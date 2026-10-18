import { BadgeCheck, ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { paseDeLista } from "@/modulos/asambleas/aplicacion/checkin";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { ValidarPoder } from "./ValidarPoder";

export const metadata: Metadata = { title: "Poderes" };

// DIR-ASA-09 (HU-ASA-07): los poderes (delegaciones de voto) por validar en la puerta. Van en su propia
// pantalla para que el pase de lista no pase de los objetivos permitidos por pantalla (R-11).
export default async function Poderes() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const proxima = await proximaAsamblea(sesion);
  const lista = proxima ? await paseDeLista(sesion, proxima.id) : null;
  const ordenados = lista ? [...lista.poderes].sort((a, b) => Number(a.validado) - Number(b.validado)) : [];
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/asambleas/pase-de-lista"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al pase de lista
      </Link>
      <h1 className="text-titulo-1">Poderes (delegaciones de voto)</h1>
      {proxima && ordenados.length > 0 ? (
        <ListaVerMas
          etiqueta="Poderes"
          normal={3}
          senior={2}
          elementos={ordenados.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <p className="font-bold">
                {p.apoderado} representa a {p.representaA}
              </p>
              <p className="text-texto-secundario">
                {p.vivienda} · Constancia N.° {p.numero}
              </p>
              {p.validado ? (
                <p className="inline-flex items-center gap-2 font-bold text-texto-exito">
                  <BadgeCheck aria-hidden className="size-icono" />
                  Validado
                </p>
              ) : (
                <ValidarPoder asambleaId={proxima.id} delegacionId={p.id} />
              )}
            </div>
          ))}
        />
      ) : (
        <p>Esta asamblea no tiene poderes registrados.</p>
      )}
    </div>
  );
}
