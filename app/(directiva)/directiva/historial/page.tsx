import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { historialDeLaDirectiva } from "@/modulos/identidad/aplicacion/auditoria";

export const metadata: Metadata = { title: "Historial de acciones" };

// DIR-INI-05 (HU-COB-16 CA3): lo que se hizo en cobros, asambleas y transparencia, de solo lectura.
export default async function Historial() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const acciones = await historialDeLaDirectiva(sesion);
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/mas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a más opciones
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Historial de acciones</h1>
        <p>Solo lectura. Queda registrado quién hizo cada acción y cuándo.</p>
      </div>
      {acciones.length > 0 ? (
        <ListaVerMas
          etiqueta="Historial de acciones"
          elementos={acciones.map((a) => (
            <article
              key={a.id}
              className="flex flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <p className="text-pequeno text-texto-secundario">{a.fecha}</p>
              <h2 className="text-titulo-3">{a.texto}</h2>
              {a.detalle && <p>{a.detalle}</p>}
              <p className="text-pequeno text-texto-secundario">{a.responsable}</p>
            </article>
          ))}
        />
      ) : (
        <p>Todavía no hay acciones registradas.</p>
      )}
    </div>
  );
}
