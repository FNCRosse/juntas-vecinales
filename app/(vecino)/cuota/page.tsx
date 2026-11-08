import {
  CircleCheck,
  HandCoins,
  Info,
  Lock,
  type LucideIcon,
  ReceiptText,
  TriangleAlert,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { OfertaDeGuia } from "@/app/_guias/OfertaDeGuia";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { Insignia, type TonoInsignia } from "@/componentes/a11y/Insignia";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { FilaEnlace, Tarjeta } from "@/componentes/a11y/Tarjeta";
import { soles } from "@/compartido/dinero";
import { miCuota } from "@/modulos/aportes/aplicacion/deuda";
import { guiaDeSeccion } from "@/modulos/accesibilidad/aplicacion/guias";

export const metadata: Metadata = { title: "Mi cuota" };

const ROLES = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

/** Estado de cada semana: color del texto e ícono, para que no dependa solo del color (WCAG 1.4.1). */
const ESTADOS: Record<string, { tono: TonoInsignia; Icono: LucideIcon }> = {
  Pendiente: { tono: "info", Icono: Info },
  "Con retraso": { tono: "aviso", Icono: TriangleAlert },
  "En revisión": { tono: "info", Icono: Info },
  "Pago en revisión": { tono: "info", Icono: Info },
  "Pago observado": { tono: "aviso", Icono: TriangleAlert },
  Pagada: { tono: "exito", Icono: CircleCheck },
};

const TEXTO_TONO: Record<TonoInsignia, string> = {
  info: "text-texto-info",
  aviso: "text-texto-aviso",
  exito: "text-texto-exito",
  error: "text-texto-error",
};

const ENLACE =
  "inline-flex min-h-tactil items-center self-start font-bold text-texto-enlace underline underline-offset-4";

// VEC-COB-01 (HU-COB-01 CA1): lo que la casa debe hoy semana por semana y cómo se calcula su cuota semanal. Solo ve
// su casa: el predio sale de su sesión.
export default async function MiCuota() {
  const sesion = await exigirActor([...ROLES], "/entrar");
  const [cuota, guia] = await Promise.all([miCuota(sesion), guiaDeSeccion(sesion.usuarioId, "CUOTA")]);
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
      {guia.ofrecer && (
        <div data-ancho="completo">
          <OfertaDeGuia seccion="CUOTA" enPausa={guia.estado === "PAUSADA"} paso={guia.paso} />
        </div>
      )}
      {cuota.rejaSuspendida && (
        <MensajeEstado tipo="aviso" titulo="Por ahora la reja no se abre sola">
          <p>Puede entrar abriéndola a mano, como siempre. Cuando se ponga al día, vuelve a abrirse sola.</p>
          <Link href="/cuota/reja" className={ENLACE}>
            Ver qué significa
          </Link>
        </MensajeEstado>
      )}
      {cuota.cobroEnCasa && (
        <MensajeEstado tipo="info" titulo="Irán a su casa a cobrar">
          <p>
            Pedido N.° {cuota.cobroEnCasa.numero} por {soles(cuota.cobroEnCasa.monto)}. Hora preferida:{" "}
            {cuota.cobroEnCasa.franja}. La directiva la llamará para confirmar el día.
          </p>
        </MensajeEstado>
      )}
      {cuota.enRevision && (
        <MensajeEstado tipo="info" titulo="Su pago está en revisión">
          <p>
            Su pago de {soles(cuota.enRevision.monto)} está en revisión. Cuando la directiva lo valide, verá
            su recibo en Mis pagos y recibos.
          </p>
        </MensajeEstado>
      )}

      <Tarjeta titulo="Lo que debe hoy" destacada>
        <p className="text-dato font-bold leading-titulo">{soles(cuota.debe)}</p>
        {semanas === 0 ? (
          <>
            <Insignia tono="exito" icono={CircleCheck}>
              Al día
            </Insignia>
            <p>Está al día. Gracias.</p>
          </>
        ) : (
          <Insignia tono={cuota.rejaSuspendida ? "error" : "aviso"} icono={TriangleAlert}>
            {semanas === 1 ? "1 semana pendiente" : `${semanas} semanas pendientes`}
          </Insignia>
        )}
        {cuota.reclamoEnRevision && (
          <Insignia tono="aviso" icono={TriangleAlert}>
            Reclamo en revisión
          </Insignia>
        )}
        {semanas > 0 && (
          <ul aria-label="Semanas pendientes" className="flex flex-col">
            {cuota.semanas.map((s) => {
              const { tono, Icono } = ESTADOS[s.estado] ?? ESTADOS.Pendiente;
              return (
                <li key={s.id}>
                  <article className="flex flex-wrap items-center justify-between gap-2 border-t border-borde-sutil py-3">
                    <span className="flex flex-col">
                      <span>{s.semana}</span>
                      <span
                        className={`inline-flex items-center gap-1 text-pequeno font-bold ${TEXTO_TONO[tono]}`}
                      >
                        <Icono aria-hidden className="size-icono-pequeno shrink-0" />
                        {s.estado}
                      </span>
                    </span>
                    <strong>
                      {s.pagado > 0 ? `Falta ${soles(s.monto)} · ya pagó ${soles(s.pagado)}` : soles(s.monto)}
                    </strong>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
        {cuota.puedePagar && (
          <BotonEnlace href="/cuota/pagar" icono={HandCoins} anchoCompleto>
            Pagar mi cuota
          </BotonEnlace>
        )}
        <p className="flex gap-2 text-pequeno text-texto-secundario">
          <Lock aria-hidden className="size-icono-pequeno shrink-0" />
          Solo usted y la directiva ven esta información.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Cómo se calcula su cuota semanal">
        {cuota.conceptos.length > 0 ? (
          <>
            <table className="w-full border-collapse text-left">
              <caption className="pb-2 text-left text-texto-secundario">
                Montos aprobados en asamblea, por semana
              </caption>
              <thead>
                <tr className="border-b-(length:--borde-ancho-control) border-borde-fuerte">
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
                    <th scope="row" className="py-3 pr-2 font-regular">
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
            {cuota.reclamoEnRevision ? (
              <Link href={`/cuota/reclamo/${cuota.reclamoEnRevision.id}`} className={ENLACE}>
                Ver mi reclamo N.° {cuota.reclamoEnRevision.numero}
              </Link>
            ) : (
              <Link href="/cuota/reclamo" className={ENLACE}>
                ¿Cree que el monto no es correcto? Hacer un reclamo
              </Link>
            )}
          </>
        ) : (
          <p>Todavía no tiene cuotas. La primera se calcula el lunes.</p>
        )}
      </Tarjeta>

      <FilaEnlace href="/cuota/pagos" icono={ReceiptText} titulo="Mis pagos y recibos" />
    </div>
  );
}
