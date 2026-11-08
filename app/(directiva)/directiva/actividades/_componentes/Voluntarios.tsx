import { CircleCheck, HandHeart, Info, TriangleAlert } from "lucide-react";
import { Insignia } from "@/componentes/a11y/Insignia";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import type { voluntariosDeLaActividad } from "@/modulos/asambleas/aplicacion/voluntarios";
import { EvaluarVoluntario } from "../EvaluarVoluntario";

type Voluntario = Awaited<ReturnType<typeof voluntariosDeLaActividad>>[number];

const INSIGNIAS = {
  PENDIENTE: { tono: "info", Icono: Info, texto: () => "Por aprobar" },
  APROBADO: {
    tono: "exito",
    Icono: CircleCheck,
    texto: (rol: string | null) => `Ayuda aprobada: ${rol ?? ""}`,
  },
  NO_APROBADO: { tono: "aviso", Icono: TriangleAlert, texto: () => "No aprobada por ahora" },
} as const;

// DIR-ASA-12 (HU-ASA-09): quienes se ofrecieron a ayudar en la actividad, con «No por ahora» y «Aprobar la ayuda».
export function Voluntarios({ pide, voluntarios }: { pide: boolean; voluntarios: Voluntario[] }) {
  return (
    <section aria-labelledby="titulo-voluntarios" className="flex flex-col gap-3">
      <h2 id="titulo-voluntarios" className="flex items-center gap-2 text-titulo-3">
        <HandHeart aria-hidden className="size-icono shrink-0 text-accion-primaria" />
        Voluntarios por aprobar
      </h2>
      {!pide ? (
        <p className="text-texto-secundario">Esta actividad no pide voluntarios.</p>
      ) : voluntarios.length === 0 ? (
        <p className="text-texto-secundario">Todavía nadie se ofreció a ayudar.</p>
      ) : (
        <ListaVerMas
          etiqueta="Voluntarios"
          normal={2}
          senior={1}
          elementos={voluntarios.map((v) => {
            const { tono, Icono, texto } = INSIGNIAS[v.estado];
            return (
              <article
                key={v.id}
                className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <strong>
                  {v.quien} · {v.vivienda}
                </strong>
                <p>Se ofreció para ayudar: {v.descripcion} Si lo aprueba, no paga la colaboración.</p>
                <Insignia tono={tono} icono={Icono}>
                  {texto(v.rolAsignado)}
                </Insignia>
                {v.estado === "PENDIENTE" && <EvaluarVoluntario voluntariadoId={v.id} nombre={v.quien} />}
              </article>
            );
          })}
        />
      )}
    </section>
  );
}
