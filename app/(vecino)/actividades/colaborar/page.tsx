import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sesionActual } from "@/app/_sesion/sesion";
import { fechaEnFrase, fechaLarga, horaCorta } from "@/compartido/fechas";
import { miColaboracion, proximaActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { Colaborar } from "./Colaborar";

export const metadata: Metadata = { title: "Colaborar con la actividad" };

// VEC-ASA-11 y VEC-ASA-12 (HU-ASA-08): elegir cuántos y cómo colaborar, y confirmar el aporte.
export default async function ColaborarPagina() {
  const sesion = await sesionActual();
  const actividad = sesion ? await proximaActividad(sesion) : null;
  // Sin actividad, o si la casa ya colaboró, se vuelve a la lista (allí se ve su aporte).
  if (!sesion || !actividad || (await miColaboracion(sesion, actividad.id))) redirect("/actividades");
  const fecha = new Date(actividad.fechaHora);
  return (
    <Colaborar
      actividadId={actividad.id}
      nombre={actividad.nombre}
      cuando={`${fechaLarga(fecha)}, ${horaCorta(fecha)}`}
      cuandoCorto={fechaEnFrase(fecha).replace(/ de \d{4}$/, "")}
      paraQue={actividad.paraQue.endsWith(".") ? actividad.paraQue : `${actividad.paraQue}.`}
      precio={actividad.precioUnidad}
      unidad={actividad.unidad}
      modalidades={actividad.modalidades}
    />
  );
}
