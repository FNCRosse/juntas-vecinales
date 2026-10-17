import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { sesionActual } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { fechaLarga, horaCorta } from "@/compartido/fechas";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";

export const metadata: Metadata = { title: "Asambleas y actividades" };

// DIR-ASA-01 (HU-ASA-01): la próxima asamblea con su quórum proyectado y el acceso para convocar.
export default async function AsambleasDirectiva() {
  const sesion = await sesionActual();
  const proxima = sesion ? await proximaAsamblea(sesion) : null;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Asambleas y actividades</h1>
      <BotonEnlace href="/directiva/asambleas/nueva" icono={CalendarDays}>
        Convocar una asamblea
      </BotonEnlace>
      <section aria-labelledby="titulo-proxima" className="flex flex-col gap-4">
        <h2 id="titulo-proxima" className="text-titulo-2">
          Próxima asamblea
        </h2>
        {proxima ? (
          <div className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6">
            <p className="font-bold">{proxima.titulo}</p>
            <p>{fechaLarga(new Date(proxima.fechaHora))}</p>
            <p className="text-texto-secundario">
              {horaCorta(new Date(proxima.fechaHora))} · {proxima.lugar}
            </p>
            <p className="pt-2 font-bold">Quórum proyectado</p>
            <p className="text-texto-secundario">Se actualiza cada vez que alguien confirma.</p>
            <p className="text-dato font-bold">
              {proxima.confirmados.total} de {proxima.padronTotal} casas
            </p>
            <dl className="flex flex-col gap-1 pt-2">
              <div className="flex justify-between gap-4">
                <dt>Confirmaron en la app</dt>
                <dd className="font-bold">{proxima.confirmados.digital}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Registradas por un mediador</dt>
                <dd className="font-bold">{proxima.confirmados.asistida}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Total</dt>
                <dd className="font-bold">{proxima.confirmados.total}</dd>
              </div>
            </dl>
            <p className="pt-2 text-texto-secundario">
              La línea marca el mínimo: {proxima.quorumRequerido} casas (la mitad del padrón más una).
            </p>
          </div>
        ) : (
          <p>No hay asambleas convocadas. Use «Convocar una asamblea» para crear la primera.</p>
        )}
      </section>
    </div>
  );
}
