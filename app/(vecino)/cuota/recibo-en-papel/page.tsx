import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { datosParaPedirRecibo } from "@/modulos/aportes/aplicacion/recibos";
import { PedirReciboEnPapel } from "./PedirReciboEnPapel";

export const metadata: Metadata = { title: "Pedir mi recibo en papel" };

// VEC-COB-14 y VEC-COB-15 (HU-COB-12 CA2): la casa pide que la directiva le lleve su recibo impreso. Solo se ofrecen los
// recibos suyos que ya le enviaron a la app y que no tienen otro pedido abierto.
export default async function ReciboEnPapel({
  searchParams,
}: {
  searchParams: Promise<{ recibo?: string }>;
}) {
  const sesion = await exigirActor(
    ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"],
    "/entrar",
  );
  const [datos, { recibo }] = await Promise.all([datosParaPedirRecibo(sesion), searchParams]);
  if (datos.recibos.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href="/cuota/pagos"
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <ChevronLeft aria-hidden className="size-icono" />
          Volver a Mis pagos
        </Link>
        <h1 className="text-titulo-1">Pedir mi recibo en papel</h1>
        <p>No tiene recibos para pedir en papel. Cuando la directiva le envíe uno, podrá pedirlo aquí.</p>
      </div>
    );
  }
  return (
    <PedirReciboEnPapel
      quienPide={datos.quienPide}
      direccion={datos.direccion}
      telefono={datos.telefono}
      recibos={datos.recibos}
      franjas={datos.franjas}
      reciboInicial={datos.recibos.find((r) => r.valor === recibo)?.valor ?? null}
    />
  );
}
