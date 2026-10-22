import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { soles } from "@/compartido/dinero";
import { miCuota } from "@/modulos/aportes/aplicacion/deuda";

export const metadata: Metadata = { title: "Mi cuota" };

const ROLES = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

const INSIGNIAS = {
  Pendiente: { clases: "border-borde-info bg-fondo-info text-texto-info", Icono: Info },
  "Con retraso": { clases: "border-borde-aviso bg-fondo-aviso text-texto-aviso", Icono: TriangleAlert },
  "En revisión": { clases: "border-borde-info bg-fondo-info text-texto-info", Icono: Info },
  Pagada: { clases: "border-borde-exito bg-fondo-exito text-texto-exito", Icono: CircleCheck },
} as const;

// VEC-COB-01 (HU-COB-01 CA1): lo que la casa debe hoy semana por semana y cómo se calcula su cuota semanal. Solo ve
// su casa: el predio sale de su sesión. «Pagar», «Mis pagos y recibos» y el reclamo llegan con HU-COB-08, 02 y 03.
export default async function MiCuota() {
  const sesion = await exigirActor([...ROLES], "/entrar");
  const cuota = await miCuota(sesion);
  if (!cuota) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-titulo-1">Mi cuota</h1>
        <MensajeEstado tipo="info" titulo="No encontramos su casa">
          <p>Todavía no figura como residente de una casa. Pida ayuda a la directiva.</p>
        </MensajeEstado>
      </div>
    );
  }
  const semanas = cuota.semanas.length;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Mi cuota</h1>
      <section aria-labelledby="titulo-debe" className="flex flex-col gap-2">
        <h2 id="titulo-debe" className="text-titulo-3">
          Lo que debe hoy
        </h2>
        <p className="text-titulo-1">{soles(cuota.debe)}</p>
        <p>
          {semanas === 0
            ? "Está al día. Gracias."
            : `${semanas} ${semanas === 1 ? "semana pendiente" : "semanas pendientes"}`}
        </p>
      </section>
      {semanas > 0 && (
        <ListaVerMas
          etiqueta="Semanas pendientes"
          elementos={cuota.semanas.map((s) => {
            const insignia = INSIGNIAS[s.estado as keyof typeof INSIGNIAS];
            return (
              <article
                key={s.id}
                className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <h3 className="text-titulo-3">{s.semana}</h3>
                <span
                  className={`inline-flex items-center gap-1 self-start rounded-pastilla border px-3 text-pequeno font-bold ${insignia.clases}`}
                >
                  <insignia.Icono aria-hidden className="size-icono-pequeno" />
                  {s.estado}
                </span>
                <p className="font-bold">{soles(s.monto)}</p>
              </article>
            );
          })}
        />
      )}
      <p className="text-texto-secundario">Solo usted y la directiva ven esta información.</p>
      <section aria-labelledby="titulo-calculo" className="flex flex-col gap-3">
        <h2 id="titulo-calculo" className="text-titulo-2">
          Cómo se calcula su cuota semanal
        </h2>
        {cuota.conceptos.length > 0 ? (
          <>
            <p>Montos aprobados en asamblea, por semana</p>
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Conceptos de su cuota semanal y su monto</caption>
              <thead>
                <tr className="border-b border-borde-sutil">
                  <th scope="col" className="py-2 pr-2 font-bold">
                    Concepto
                  </th>
                  <th scope="col" className="py-2 text-right font-bold">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody>
                {cuota.conceptos.map((c) => (
                  <tr key={c.clave} className="border-b border-borde-sutil">
                    <th scope="row" className="py-3 pr-2 font-normal">
                      {c.unidad !== "POR_FAMILIA" || c.cantidad > 1
                        ? `${c.nombre} (${c.cantidad})`
                        : c.nombre}
                    </th>
                    <td className="py-3 text-right">{soles(c.monto)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="py-3 pr-2 font-bold">
                    Total por semana
                  </th>
                  <td className="py-3 text-right font-bold">{soles(cuota.porSemana)}</td>
                </tr>
              </tfoot>
            </table>
          </>
        ) : (
          <p>Todavía no tiene cuotas. La primera se calcula el lunes.</p>
        )}
      </section>
    </div>
  );
}
