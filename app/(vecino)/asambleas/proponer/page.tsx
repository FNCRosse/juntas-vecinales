import type { Metadata } from "next";
import { sesionActual } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { fechaEnFrase } from "@/compartido/fechas";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { misPropuestas } from "@/modulos/asambleas/aplicacion/propuestas";
import { ProponerTema } from "./ProponerTema";

export const metadata: Metadata = { title: "Proponer un tema" };

const ESTADOS = {
  PENDIENTE_REVISION: "Pendiente de revisión",
  INCLUIDA: "Incluida en la agenda",
  NO_INCLUIDA: "No incluida",
} as const;

// VEC-ASA-10 (HU-ASA-13): proponer un tema para la agenda de la próxima asamblea y ver cómo van las propias.
export default async function Proponer() {
  const sesion = await sesionActual();
  const ahora = new Date();
  const asamblea = sesion ? await proximaAsamblea(sesion, ahora) : null;
  if (!sesion || !asamblea) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-titulo-1">Proponer un tema</h1>
        <p>No hay ninguna asamblea convocada por ahora.</p>
        <BotonEnlace href="/asambleas">Volver a Asambleas</BotonEnlace>
      </div>
    );
  }

  const cierre = new Date(asamblea.cierreAgenda);
  const abierta =
    ahora.getTime() <= cierre.getTime() && ["PUBLICADA", "REPROGRAMADA"].includes(asamblea.estado);
  const propias = await misPropuestas(sesion, asamblea.id);
  return (
    <div className="flex flex-col gap-6">
      {abierta ? (
        <ProponerTema asambleaId={asamblea.id} hastaCuando={fechaEnFrase(cierre)} />
      ) : (
        <>
          <h1 className="text-titulo-1">Proponer un tema</h1>
          <MensajeEstado tipo="info" titulo="La agenda ya cerró">
            <p>
              Ya no se reciben propuestas para la asamblea del {fechaEnFrase(new Date(asamblea.fechaHora))}.
            </p>
          </MensajeEstado>
          <BotonEnlace href="/asambleas">Volver a Asambleas</BotonEnlace>
        </>
      )}
      {propias.length > 0 && (
        <section aria-labelledby="titulo-mis-propuestas" className="flex flex-col gap-3">
          <h2 id="titulo-mis-propuestas" className="text-titulo-2">
            Mis propuestas
          </h2>
          <ul className="flex flex-col gap-3">
            {propias.map((p) => (
              <li key={p.id} className="flex flex-col">
                <span className="font-bold">{p.titulo}</span>
                <span className="text-texto-secundario">{ESTADOS[p.estado]}</span>
                {p.motivoDecision && <span>{p.motivoDecision}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
