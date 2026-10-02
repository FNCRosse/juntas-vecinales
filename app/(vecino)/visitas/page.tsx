import { CircleCheck, DoorOpen, TriangleAlert, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { BotonEnlace, clasesBoton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { misVisitas } from "@/modulos/identidad/aplicacion/visitas";

export const metadata: Metadata = { title: "Mis visitas" };

// VEC-GAR-01 Mis visitas (HU-GAR-04, HU-GAR-05).
export default async function MisVisitas({ searchParams }: { searchParams: Promise<{ anulada?: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const { programadas, llegaron, puedeRegistrar } = await misVisitas(sesion);
  const { anulada } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Mis visitas</h1>
        <p>Las personas de esta lista entran sin esperar: el vigilante ya sabe que vienen a su casa.</p>
      </div>
      {anulada && (
        <MensajeEstado tipo="exito" titulo={`Anulamos la visita de ${anulada}`}>
          <p>
            El vigilante ya no la ve en la lista. Si igual llega, le preguntarán a usted antes de dejarla
            pasar.
          </p>
        </MensajeEstado>
      )}
      <BotonEnlace
        href="/visitas/nueva"
        variante={puedeRegistrar ? "primario" : "secundario"}
        icono={UserPlus}
      >
        Registrar una visita
      </BotonEnlace>
      <Tarjeta titulo="Visitas programadas">
        {programadas.length ? (
          <ul className="flex flex-col gap-4">
            {programadas.map((v) => (
              <li key={v.id} className="flex flex-col gap-2 border-b border-borde-sutil pb-4 last:border-b-0">
                <strong className="text-titulo-3">{v.nombre}</strong>
                <span>{v.cuando}</span>
                <span className="text-texto-secundario">{v.vehiculo}</span>
                <span className="inline-flex items-center gap-2 font-bold text-texto-exito">
                  <CircleCheck aria-hidden className="size-icono-pequeno" />
                  En la lista de la garita
                </span>
                <Link href={`/visitas/${v.id}/anular`} className={`${clasesBoton("secundario")} self-start`}>
                  <TriangleAlert aria-hidden className="size-icono shrink-0" />
                  <span>
                    Anular esta visita<span className="sr-only"> de {v.nombre}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            <strong>No tiene visitas programadas.</strong> Si espera a alguien, regístrelo y entrará sin
            demora.
          </p>
        )}
      </Tarjeta>
      {llegaron.length > 0 && (
        <Tarjeta titulo="Llegaron hace poco">
          <ul className="flex flex-col gap-3">
            {llegaron.map((v) => (
              <li key={v.id} className="flex items-start gap-3">
                <DoorOpen aria-hidden className="size-icono shrink-0 text-accion-primaria" />
                <span className="flex flex-col">
                  <strong>{v.nombre}</strong>
                  <span>Entró el {fechaYHora(new Date(v.llegoEn ?? ""))} · estaba en su lista</span>
                </span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
    </div>
  );
}
