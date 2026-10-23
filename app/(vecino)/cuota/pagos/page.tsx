import {
  Camera,
  ChevronLeft,
  CircleCheck,
  FileDown,
  Info,
  Printer,
  Receipt,
  TriangleAlert,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { soles } from "@/compartido/dinero";
import { miCuota } from "@/modulos/aportes/aplicacion/deuda";
import { misPagos } from "@/modulos/aportes/aplicacion/pagos";

export const metadata: Metadata = { title: "Mis pagos y recibos" };

const INSIGNIAS = {
  "En revisión": { clases: "border-borde-info bg-fondo-info text-texto-info", Icono: Info },
  Aprobado: { clases: "border-borde-exito bg-fondo-exito text-texto-exito", Icono: CircleCheck },
  Observado: { clases: "border-borde-aviso bg-fondo-aviso text-texto-aviso", Icono: TriangleAlert },
  Rechazado: { clases: "border-borde-aviso bg-fondo-aviso text-texto-aviso", Icono: TriangleAlert },
} as const;

// VEC-COB-05 (HU-COB-02 CA1, HU-COB-08): los pagos que mandó la casa con su fecha, su medio y su estado, y las semanas
// que ya se pagaron. Solo ve su casa. Si la directiva observó un pago, aquí se dice por qué y se manda
// otra foto (HU-COB-10); los recibos llegan con HU-COB-12.
export default async function MisPagos() {
  const sesion = await exigirActor(
    ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    "/entrar",
  );
  const [cuota, { pagos }] = await Promise.all([miCuota(sesion), misPagos(sesion)]);
  const historial = cuota?.historial ?? [];
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/cuota"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Mi cuota
      </Link>
      <h1 className="text-titulo-1">Mis pagos y recibos</h1>
      {pagos.some((p) => p.recibo) && (
        <BotonEnlace href="/cuota/recibo-en-papel" variante="secundario" icono={Printer}>
          Pedir un recibo en papel
        </BotonEnlace>
      )}
      {pagos.length > 0 && (
        <ListaVerMas
          etiqueta="Pagos enviados"
          elementos={pagos.map((p) => {
            const insignia = INSIGNIAS[p.estado as keyof typeof INSIGNIAS];
            return (
              <article
                key={p.id}
                className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <h2 className="text-titulo-3">{p.recibo ? `Recibo N.° ${p.recibo.numero}` : p.titulo}</h2>
                <p className="font-bold">{soles(p.monto)}</p>
                <p className="text-texto-secundario">{p.detalle}</p>
                <span
                  className={`inline-flex items-center gap-1 self-start rounded-pastilla border px-3 text-pequeno font-bold ${insignia.clases}`}
                >
                  <insignia.Icono aria-hidden className="size-icono-pequeno" />
                  {p.estado}
                  {p.motivo && `: ${p.motivo}`}
                </span>
                {p.puedeEnviarOtraFoto && (
                  <BotonEnlace href={`/cuota/pagos/${p.id}/otra-foto`} icono={Camera}>
                    Enviar otra foto
                  </BotonEnlace>
                )}
                {p.recibo && (
                  <BotonEnlace href={`/cuota/recibos/${p.recibo.id}`} icono={Receipt}>
                    Ver el recibo
                  </BotonEnlace>
                )}
                {p.estado !== "Aprobado" && (
                  <BotonEnlace
                    href={`/api/aportes/pagos/${p.id}/constancia`}
                    variante="secundario"
                    icono={FileDown}
                  >
                    Constancia de envío {p.constancia}
                  </BotonEnlace>
                )}
              </article>
            );
          })}
        />
      )}
      {historial.length > 0 && (
        <section aria-labelledby="titulo-pagadas" className="flex flex-col gap-4">
          <h2 id="titulo-pagadas" className="text-titulo-2">
            Semanas pagadas
          </h2>
          <ListaVerMas
            etiqueta="Semanas pagadas"
            elementos={historial.map((h) => (
              <article
                key={h.id}
                className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <h3 className="text-titulo-3">{h.semana}</h3>
                <p className="font-bold">{soles(h.monto)}</p>
                <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-exito bg-fondo-exito px-3 text-pequeno font-bold text-texto-exito">
                  <CircleCheck aria-hidden className="size-icono-pequeno" />
                  Pagada
                </span>
              </article>
            ))}
          />
        </section>
      )}
      {pagos.length === 0 && historial.length === 0 && <p>Todavía no tiene pagos registrados.</p>}
      <p className="text-texto-secundario">Solo usted y la directiva ven esta información.</p>
    </div>
  );
}
