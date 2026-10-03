import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { GraficoBalance } from "@/componentes/a11y/GraficoBalance";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { fechaYHora } from "@/compartido/fechas";
import { verBalance } from "@/modulos/transparencia/aplicacion/balances";

export const metadata: Metadata = { title: "Balance de una actividad" };

// VEC-TRA-03 Balance de una actividad (HU-ASA-12 CA2): ingresos, gastos y saldo, en gráfico y en tabla.
export default async function Balance({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const balance = await verBalance(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/transparencia"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Actas y balances
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">{balance.titulo}</h1>
        <p className="text-texto-secundario">
          Actividad del {balance.fechaActividad.toLowerCase()} · publicado el{" "}
          {fechaYHora(new Date(balance.fecha))}
        </p>
      </div>
      <GraficoBalance totales={balance.totales} />
      <section aria-labelledby="titulo-ingresos" className="flex flex-col gap-2">
        <h2 id="titulo-ingresos" className="text-titulo-3">
          De dónde vino el dinero
        </h2>
        <dl className="flex flex-col gap-2">
          <div className="flex justify-between gap-2">
            <dt>Ingresos virtuales</dt>
            <dd className="font-bold">{soles(balance.ingresosVirtuales)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Ingresos en puerta</dt>
            <dd className="font-bold">{soles(balance.ingresosEnPuerta)}</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="titulo-gastos" className="flex flex-col gap-2">
        <h2 id="titulo-gastos" className="text-titulo-3">
          En qué se gastó
        </h2>
        {balance.egresos.length ? (
          <ul className="flex flex-col gap-2">
            {balance.egresos.map((e, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>{e.concepto}</span>
                <strong>{soles(e.monto)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>No hubo gastos.</p>
        )}
      </section>
      <p className="text-pequeno text-texto-secundario">
        Publicado por {balance.autor}. Este balance ya no se puede modificar.
      </p>
    </div>
  );
}
