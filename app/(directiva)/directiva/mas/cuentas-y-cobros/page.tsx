import { Banknote, ChartColumn, FileText, HandCoins, List } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { Categoria } from "../_componentes/Categoria";

export const metadata: Metadata = { title: "Cuentas y cobros" };

// DIR-INI-04 · Más · Cuentas y cobros (prototipo DMA03). «Poner al día a un vecino» (HU-COB-07) vive aquí y no en Cobros.
export default async function CuentasYCobros() {
  await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  return (
    <Categoria
      titulo="Cuentas y cobros"
      destinos={[
        { href: "/directiva/cobros/recaudacion", titulo: "Recaudación y exportar", icono: ChartColumn },
        { href: "/directiva/cobros/tarifa", titulo: "Tarifa de la cuota semanal", icono: List },
        { href: "/directiva/cuentas/movimientos", titulo: "Ingresos y gastos", icono: Banknote },
        { href: "/directiva/cuentas", titulo: "Rendición de cuentas", icono: FileText },
        {
          href: "/directiva/cobros/poner-al-dia",
          titulo: "Poner al día a un vecino",
          icono: HandCoins,
          detalle: "Registrar el pago de toda su deuda",
        },
      ]}
    />
  );
}
