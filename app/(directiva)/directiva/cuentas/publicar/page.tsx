import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { rendicionDeCuentas } from "@/modulos/transparencia/aplicacion/caja";
import { PublicarRendicion } from "./PublicarRendicion";

export const metadata: Metadata = { title: "Publicar la rendición" };

// DIR-TRA-02 (HU-COB-14): la confirmación de publicar la rendición de cuentas del mes. Solo la directiva; el mediador y un mes ya
// publicado o vacío ven por qué no se puede.
export default async function Publicar({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const r = await rendicionDeCuentas(sesion, (await searchParams).mes);
  const motivo = !sesion.roles.includes("DIRECTIVA")
    ? "Solo la directiva publica la rendición."
    : r.publicada
      ? "Esta rendición ya se publicó. Después de publicarla no se puede modificar."
      : r.ingresos === 0 && r.gastos === 0
        ? "Este mes no tiene ningún ingreso ni gasto para publicar."
        : null;
  if (motivo) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href={`/directiva/cuentas?mes=${r.mes}`}
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <ChevronLeft aria-hidden className="size-icono" />
          Volver a la rendición
        </Link>
        <h1 className="text-titulo-1">Publicar la rendición de {r.etiqueta.toLowerCase()}</h1>
        <MensajeEstado tipo="info" titulo="No se puede publicar">
          <p>{motivo}</p>
        </MensajeEstado>
      </div>
    );
  }
  return (
    <PublicarRendicion
      mes={r.mes}
      etiqueta={r.etiqueta}
      ingresos={r.ingresos}
      gastos={r.gastos}
      saldo={r.saldo}
      comprobantes={r.comprobantes}
    />
  );
}
