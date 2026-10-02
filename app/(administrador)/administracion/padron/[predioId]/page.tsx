import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { verVivienda } from "@/modulos/identidad/aplicacion/consultarPadron";

export const metadata: Metadata = { title: "Ficha de la vivienda" };

// ADM-PAD-02 Ficha de la vivienda. Las acciones (actualizar el predio, dar de baja, reenviar el
// enlace) y el historial llegan con sus HU.
export default async function FichaVivienda({ params }: { params: Promise<{ predioId: string }> }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const vivienda = await verVivienda(sesion, (await params).predioId).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/administracion/padron"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al padrón
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Ficha de vivienda</p>
        <h1 className="text-titulo-1">{vivienda.direccion}</h1>
        <p>Titular: {vivienda.titular}</p>
      </div>

      <Tarjeta titulo="Quiénes viven aquí">
        <ul className="flex flex-col gap-3">
          {vivienda.residentes.map((r) => (
            <li key={r.usuarioId} className="flex flex-col border-b border-borde-sutil pb-3 last:border-b-0">
              <strong>{r.nombre}</strong>
              <span>
                {r.relacion} · DNI {r.dni}
              </span>
              <span className="text-texto-secundario">
                {r.whatsapp
                  ? `WhatsApp ${r.whatsapp}`
                  : "Sin cuenta propia: los avisos le llegan a la persona titular"}
              </span>
            </li>
          ))}
        </ul>
      </Tarjeta>

      <Tarjeta titulo="Datos del predio">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col">
            <dt className="text-pequeno text-texto-secundario">Uso</dt>
            <dd className="font-bold">{vivienda.uso}</dd>
          </div>
          {vivienda.conceptos.map(({ concepto, cantidad }) => (
            <div key={concepto} className="flex flex-col">
              <dt className="text-pequeno text-texto-secundario">{concepto}</dt>
              <dd className="font-bold">{cantidad}</dd>
            </div>
          ))}
        </dl>
      </Tarjeta>
    </div>
  );
}
