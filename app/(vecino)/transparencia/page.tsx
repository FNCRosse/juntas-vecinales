import { Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { soles } from "@/compartido/dinero";
import { actasPublicadas } from "@/modulos/transparencia/aplicacion/actas";
import { balancesPublicados } from "@/modulos/transparencia/aplicacion/balances";

export const metadata: Metadata = { title: "Actas y balances" };

// VEC-TRA-02 Actas y balances (HU-ASA-11 CA2 y CA3): las actas publicadas, las más nuevas primero. El
// historial completo con los balances llega con HU-ASA-12.
export default async function ActasYBalances() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const [actas, balances] = await Promise.all([actasPublicadas(sesion), balancesPublicados(sesion)]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Actas y balances</h1>
        <p className="text-texto-secundario">Lo que decidió la asamblea, publicado por la directiva.</p>
      </div>
      {balances.length > 0 && (
        <section aria-labelledby="titulo-balances" className="flex flex-col gap-4">
          <h2 id="titulo-balances" className="text-titulo-2">
            Balances de actividades
          </h2>
          <ul className="flex flex-col gap-separacion" aria-label="Balances">
            {balances.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/transparencia/balances/${b.id}`}
                  className="flex min-h-tactil flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte"
                >
                  <strong className="text-titulo-3 text-texto-enlace underline underline-offset-4">
                    {b.titulo}
                  </strong>
                  <span className="text-texto-secundario">
                    Actividad del {b.fechaActividad.toLowerCase()}
                  </span>
                  <span>
                    Ingresos {soles(b.totales.ingresos)} · Gastos {soles(b.totales.egresos)} ·{" "}
                    {b.totales.utilidadNeta < 0 ? "Pérdida" : "Utilidad neta"} {soles(b.totales.utilidadNeta)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="text-titulo-2">Actas de asamblea</h2>
        </section>
      )}
      {actas.length ? (
        <ul className="flex flex-col gap-separacion" aria-label="Actas">
          {actas.map((a) => (
            <li key={a.id}>
              <article className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta">
                <p className="text-pequeno text-texto-secundario">
                  Asamblea del {a.fechaAsamblea.toLowerCase()} · publicada el {fechaYHora(new Date(a.fecha))}
                </p>
                <h2 className="text-titulo-3">{a.titulo}</h2>
                <h3 className="font-bold">Acuerdos</h3>
                <ol className="list-decimal pl-6">
                  {a.acuerdos.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ol>
                {a.compromisos.length > 0 && (
                  <>
                    <h3 className="font-bold">Compromisos</h3>
                    <ol className="list-decimal pl-6">
                      {a.compromisos.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ol>
                  </>
                )}
                {a.conclusiones && (
                  <>
                    <h3 className="font-bold">Conclusiones</h3>
                    <p>{a.conclusiones}</p>
                  </>
                )}
                <a
                  href={`/api/transparencia/actas/${a.id}/pdf`}
                  className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace underline underline-offset-4"
                >
                  <Download aria-hidden className="size-icono" />
                  Descargar el acta en PDF
                </a>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div role="status" className="flex flex-col items-center gap-2 p-6 text-center">
          <FileText aria-hidden className="size-icono text-texto-secundario" />
          <strong>Todavía no hay actas publicadas</strong>
          <span>Cuando la directiva publique una, la verá aquí.</span>
        </div>
      )}
    </div>
  );
}
