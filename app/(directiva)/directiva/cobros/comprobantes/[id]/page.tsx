import { CircleCheck, ChevronLeft, FileText, Info, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { soles } from "@/compartido/dinero";
import { verComprobante } from "@/modulos/aportes/aplicacion/pagos";
import { AprobarPago } from "./AprobarPago";

export const metadata: Metadata = { title: "Revisar un comprobante" };

// DIR-COB-02 (HU-COB-09 CA1): la captura del comprobante junto a lo que declaró la casa y lo que figura en la junta, y qué
// pasaría al aprobarlo. Solo la directiva aprueba u observa (HU-COB-10).
export default async function RevisarComprobante({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const c = await verComprobante(sesion, (await params).id);
  const completo = c.cubre === "Cubre el 100 %";
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/cobros"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a comprobantes
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Comprobante por revisar</p>
        <h1 className="text-titulo-1">Pago de {c.nombre}</h1>
        <p>{c.vivienda}</p>
      </div>
      {c.archivo &&
        (c.archivo.tipo.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element -- la imagen viene firmada de R2, sin optimizar.
          <img
            src={`/api/archivos/${c.archivo.id}`}
            alt={`Captura del comprobante que envió ${c.nombre}`}
            className="w-full rounded-control border border-borde-sutil"
          />
        ) : (
          <Link
            href={`/api/archivos/${c.archivo.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-tactil items-center gap-2 font-bold text-texto-enlace underline underline-offset-4"
          >
            <FileText aria-hidden className="size-icono" />
            Abrir el comprobante (PDF, se abre en otra pestaña)
          </Link>
        ))}
      <section aria-labelledby="titulo-comparar" className="flex flex-col gap-3">
        <h2 id="titulo-comparar" className="text-titulo-2">
          Compare con lo que figura en la junta
        </h2>
        <dl className="flex flex-col gap-3">
          {[
            ["Monto que declaró", soles(c.monto)],
            ["Lo que debe esta casa", soles(c.debe)],
            ["Qué paga", c.semanas],
            ["Enviado el", c.enviado],
            ["Cuenta de destino", c.cuentaDeDestino],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex flex-col">
              <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
              <dd className="font-bold">{valor}</dd>
            </div>
          ))}
        </dl>
        <span
          className={`inline-flex items-center gap-1 self-start rounded-pastilla border px-3 text-pequeno font-bold ${completo ? "border-borde-exito bg-fondo-exito text-texto-exito" : "border-borde-aviso bg-fondo-aviso text-texto-aviso"}`}
        >
          {completo ? (
            <CircleCheck aria-hidden className="size-icono-pequeno" />
          ) : (
            <TriangleAlert aria-hidden className="size-icono-pequeno" />
          )}
          {c.cubre}
        </span>
        <p>{c.efecto}</p>
      </section>
      {c.estado !== "En revisión" ? (
        <p className="inline-flex items-center gap-1 font-bold">
          <Info aria-hidden className="size-icono-pequeno" />
          Este pago ya fue revisado: {c.estado.toLowerCase()}.
        </p>
      ) : c.puedeAprobar ? (
        <AprobarPago
          comprobanteId={c.id}
          hrefObservar={`/directiva/cobros/comprobantes/${c.id}/observar`}
          nombre={c.nombre}
          vivienda={c.vivienda}
          monto={c.monto}
          debe={c.debe}
          medio={c.medio}
          semanas={c.semanas}
        />
      ) : (
        <p className="inline-flex items-center gap-1 font-bold">
          <Info aria-hidden className="size-icono-pequeno" />
          {c.esSuyo ? "Es su pago: lo revisa otro miembro." : "Solo la directiva aprueba los pagos."}
        </p>
      )}
    </div>
  );
}
