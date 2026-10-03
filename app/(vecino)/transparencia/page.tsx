import { Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { soles } from "@/compartido/dinero";
import { fechaYHora } from "@/compartido/fechas";
import { historialPublico } from "@/modulos/transparencia/aplicacion/historial";

export const metadata: Metadata = { title: "Actas y balances" };

// VEC-TRA-02 Actas y balances (HU-ASA-12 CA1 y CA3; HU-ASA-11 CA2): el historial público, del evento más
// nuevo al más antiguo, para todo vecino con sesión. Cada balance enlaza a su detalle (VEC-TRA-03).
export default async function ActasYBalances() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const historial = await historialPublico(sesion);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Actas y balances</h1>
        <p className="text-texto-secundario">
          Lo que decidió la asamblea y lo que se recaudó y gastó, publicado por la directiva. Lo más reciente
          primero.
        </p>
      </div>
      {historial.length ? (
        <ul className="flex flex-col gap-separacion" aria-label="Actas y balances">
          {historial.map((r) => (
            <li key={`${r.tipo}-${r.id}`}>
              <article className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta">
                <p className="text-pequeno text-texto-secundario">
                  {r.tipo === "ACTA" ? "Acta de asamblea" : "Balance de actividad"} del{" "}
                  {r.fechaEvento.toLowerCase()} · publicado el {fechaYHora(new Date(r.fecha))}
                </p>
                {r.tipo === "ACTA" ? (
                  <>
                    <h2 className="text-titulo-3">{r.titulo}</h2>
                    <h3 className="font-bold">Acuerdos</h3>
                    <ol className="list-decimal pl-6">
                      {r.acuerdos.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ol>
                    {r.compromisos.length > 0 && (
                      <>
                        <h3 className="font-bold">Compromisos</h3>
                        <ol className="list-decimal pl-6">
                          {r.compromisos.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ol>
                      </>
                    )}
                    {r.conclusiones && (
                      <>
                        <h3 className="font-bold">Conclusiones</h3>
                        <p>{r.conclusiones}</p>
                      </>
                    )}
                    <a
                      href={`/api/transparencia/actas/${r.id}/pdf`}
                      className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace underline underline-offset-4"
                    >
                      <Download aria-hidden className="size-icono" />
                      Descargar el acta en PDF
                    </a>
                  </>
                ) : (
                  <>
                    <h2 className="text-titulo-3">
                      <Link
                        href={`/transparencia/balances/${r.id}`}
                        className="text-texto-enlace underline underline-offset-4"
                      >
                        {r.titulo}
                      </Link>
                    </h2>
                    <dl className="flex flex-col gap-1">
                      <div className="flex justify-between gap-2">
                        <dt>Ingresos</dt>
                        <dd className="font-bold">{soles(r.totales.ingresos)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Gastos</dt>
                        <dd className="font-bold">{soles(r.totales.egresos)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Saldo final</dt>
                        <dd className="font-bold">{soles(r.totales.utilidadNeta)}</dd>
                      </div>
                    </dl>
                  </>
                )}
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div role="status" className="flex flex-col items-center gap-2 p-6 text-center">
          <FileText aria-hidden className="size-icono text-texto-secundario" />
          <strong>Todavía no hay actas ni balances publicados</strong>
          <span>Cuando la directiva publique uno, lo verá aquí.</span>
        </div>
      )}
    </div>
  );
}
