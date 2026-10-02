import { Phone } from "lucide-react";
import Link from "next/link";
import { clasesBotonBarra } from "./Boton";
import { InterruptorLetraGrande } from "./InterruptorLetraGrande";

// Barra superior de todas las pantallas (prototipo C-09): nombre de la junta, "Letra grande" y
// "Pedir ayuda" siempre en la misma posición (WCAG 3.2.6, regla A12).

function Isologo() {
  return (
    <svg viewBox="0 0 32 36" aria-hidden className="h-10 w-9 shrink-0 senior:h-12 senior:w-11">
      <path
        className="fill-accion-primaria"
        d="M16 1 L30 6 V17 C30 26 23.5 32.5 16 35 C8.5 32.5 2 26 2 17 V6 Z"
      />
      <path
        className="fill-none stroke-fondo-superficie"
        strokeWidth={1}
        d="M16 4.2 L27 8.1 V17 C27 24.2 22 29.6 16 31.8 C10 29.6 5 24.2 5 17 V8.1 Z"
      />
      <path className="fill-fondo-superficie" d="M10 16.2 V25 H22 V16.2" />
      <path
        className="fill-none stroke-fondo-superficie"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 17.5 L16 10.2 L24.5 17.5"
      />
      <rect className="fill-decoracion-calido" x={14.1} y={19} width={3.8} height={6} rx={0.8} />
    </svg>
  );
}

export function Encabezado({ modoSenior, rutaAyuda }: { modoSenior: boolean; rutaAyuda?: string }) {
  return (
    <header className="border-b border-borde-sutil bg-fondo-superficie">
      <div className="mx-auto flex max-w-300 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Isologo />
          <p className="flex flex-col leading-titulo">
            <strong className="text-base">Junta Vecinal</strong>
            <span className="text-pequeno text-texto-secundario">Villa de Fátima</span>
          </p>
        </div>
        <div className={`grid gap-separacion md:flex ${rutaAyuda ? "grid-cols-2" : "grid-cols-1"}`}>
          <InterruptorLetraGrande activoAlInicio={modoSenior} />
          {rutaAyuda && (
            <Link href={rutaAyuda} className={clasesBotonBarra()}>
              <Phone aria-hidden className="size-icono shrink-0" />
              <span>Pedir ayuda</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
