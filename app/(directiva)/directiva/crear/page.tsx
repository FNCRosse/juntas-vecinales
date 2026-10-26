import { CalendarDays, FileText, HandHeart, Landmark, Megaphone, Wallet } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";

export const metadata: Metadata = { title: "Crear o registrar" };

// DIR-ASA-16: el menú para crear o registrar. Los movimientos de ingresos y gastos llegan con HU-ASA-10;
// por ahora: asamblea, actividad pro-fondos, comunicado, acta y balance.
export default async function CrearDirectiva() {
  await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Crear o registrar</h1>
        <p className="text-texto-secundario">
          Asambleas, actividades pro-fondos, comunicados, actas y balances de la junta.
        </p>
      </div>
      <div className="flex flex-col items-start gap-separacion">
        <BotonEnlace href="/directiva/asambleas/nueva" variante="secundario" icono={CalendarDays}>
          Convocar una asamblea
        </BotonEnlace>
        <BotonEnlace href="/directiva/actividades/nueva" variante="secundario" icono={HandHeart}>
          Nueva actividad pro-fondos
        </BotonEnlace>
        <BotonEnlace href="/directiva/comunicados/nuevo" variante="secundario" icono={Megaphone}>
          Publicar un comunicado
        </BotonEnlace>
        <BotonEnlace href="/directiva/actas/nueva" variante="secundario" icono={FileText}>
          Publicar un acta
        </BotonEnlace>
        <BotonEnlace href="/directiva/balances/nuevo" variante="secundario" icono={Landmark}>
          Publicar un balance
        </BotonEnlace>
        <BotonEnlace href="/directiva/cuentas/registrar" variante="secundario" icono={Wallet}>
          Registrar un ingreso o gasto
        </BotonEnlace>
      </div>
    </div>
  );
}
