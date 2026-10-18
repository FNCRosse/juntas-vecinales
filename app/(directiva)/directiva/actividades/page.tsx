import { ChevronLeft, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { fechaLarga, horaCorta } from "@/compartido/fechas";
import { proximaActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { voluntariosDeLaActividad } from "@/modulos/asambleas/aplicacion/voluntarios";
import { EvaluarVoluntario } from "./EvaluarVoluntario";

export const metadata: Metadata = { title: "Actividad pro-fondos" };

const INSIGNIAS = {
  PENDIENTE: {
    clases: "border-borde-info bg-fondo-info text-texto-info",
    Icono: Info,
    texto: () => "Por aprobar",
  },
  APROBADO: {
    clases: "border-borde-exito bg-fondo-exito text-texto-exito",
    Icono: CircleCheck,
    texto: (rol: string | null) => `Ayuda aprobada: ${rol ?? ""}`,
  },
  NO_APROBADO: {
    clases: "border-borde-aviso bg-fondo-aviso text-texto-aviso",
    Icono: TriangleAlert,
    texto: () => "No aprobada por ahora",
  },
} as const;

// DIR-ASA-12 (HU-ASA-09): la actividad pro fondos y los voluntarios por aprobar. Los ingresos, los gastos y el
// balance de la actividad llegan con HU-ASA-10.
export default async function ActividadDirectiva() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const actividad = await proximaActividad(sesion);
  const voluntarios = actividad ? await voluntariosDeLaActividad(sesion, actividad.id) : [];
  const fecha = actividad ? new Date(actividad.fechaHora) : null;
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/asambleas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a asambleas
      </Link>
      {actividad && fecha ? (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-texto-secundario">{fechaLarga(fecha)}</p>
            <h1 className="text-titulo-1">{actividad.nombre}</h1>
            <p>
              {horaCorta(fecha)} · {actividad.lugar} · {actividad.precioTexto} por {actividad.unidad.singular}
              .
            </p>
          </div>
          <section aria-labelledby="titulo-voluntarios" className="flex flex-col gap-3">
            <h2 id="titulo-voluntarios" className="text-titulo-2">
              Voluntarios por aprobar
            </h2>
            {!actividad.pideVoluntarios ? (
              <p>Esta actividad no pide voluntarios.</p>
            ) : voluntarios.length === 0 ? (
              <p>Todavía nadie se ofreció a ayudar.</p>
            ) : (
              <ListaVerMas
                etiqueta="Voluntarios"
                normal={2}
                senior={1}
                elementos={voluntarios.map((v) => {
                  const insignia = INSIGNIAS[v.estado];
                  return (
                    <article
                      key={v.id}
                      className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
                    >
                      <p className="font-bold">
                        {v.quien} · {v.vivienda}
                      </p>
                      <p>Se ofreció para ayudar: {v.descripcion} Si lo aprueba, no paga la colaboración.</p>
                      <span
                        className={`inline-flex items-center gap-1 self-start rounded-pastilla border px-3 text-pequeno font-bold ${insignia.clases}`}
                      >
                        <insignia.Icono aria-hidden className="size-icono-pequeno" />
                        {insignia.texto(v.rolAsignado)}
                      </span>
                      {v.estado === "PENDIENTE" && (
                        <EvaluarVoluntario voluntariadoId={v.id} nombre={v.quien} />
                      )}
                    </article>
                  );
                })}
              />
            )}
          </section>
        </>
      ) : (
        <>
          <h1 className="text-titulo-1">Actividad pro-fondos</h1>
          <p>No hay ninguna actividad pro-fondos publicada.</p>
          <BotonEnlace href="/directiva/actividades/nueva">Nueva actividad pro-fondos</BotonEnlace>
        </>
      )}
    </div>
  );
}
