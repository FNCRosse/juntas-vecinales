import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sesionActual } from "@/app/_sesion/sesion";
import { fechaEnFrase, fechaLarga, horaCorta } from "@/compartido/fechas";
import { miColaboracion, proximaActividad, verActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { miVoluntariado } from "@/modulos/asambleas/aplicacion/voluntarios";
import { Colaborar } from "./Colaborar";

export const metadata: Metadata = { title: "Colaborar con la actividad" };

// VEC-ASA-11 y VEC-ASA-12 (HU-ASA-08): elegir cuántos y cómo colaborar, y confirmar el aporte.
export default async function ColaborarPagina({
  searchParams,
}: {
  searchParams: Promise<{ actividad?: string }>;
}) {
  const sesion = await sesionActual();
  const { actividad: id } = await searchParams;
  // La actividad que se abrió (?actividad=…) o, sin ella, la próxima. Una que ya pasó no recibe aportes.
  const elegida =
    sesion && id
      ? await verActividad(sesion, id).catch(() => null)
      : sesion
        ? await proximaActividad(sesion)
        : null;
  const actividad = elegida && new Date(elegida.fechaHora) > new Date() ? elegida : null;
  // Sin actividad, o si la casa ya colaboró o se ofreció, se vuelve a la lista (allí se ve su aporte). Si su
  // ofrecimiento no se aprobó por ahora, puede elegir pagar.
  const ayuda = sesion && actividad ? await miVoluntariado(sesion, actividad.id) : null;
  if (
    !sesion ||
    !actividad ||
    (await miColaboracion(sesion, actividad.id)) ||
    (ayuda && ayuda.estado !== "NO_APROBADO")
  ) {
    redirect(id ? `/actividades/${id}` : "/actividades");
  }
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
      pideVoluntarios={actividad.pideVoluntarios && ayuda === null}
    />
  );
}
