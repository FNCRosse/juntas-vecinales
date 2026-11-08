import { CirclePlus } from "lucide-react";
import type { Metadata } from "next";
import { ListaDeActividades } from "@/app/_actividades/ListaDeActividades";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { EncabezadoPagina } from "@/componentes/a11y/EncabezadoPagina";
import { verActividades } from "@/modulos/asambleas/aplicacion/actividades";
import { balancesPublicados } from "@/modulos/transparencia/aplicacion/balances";

export const metadata: Metadata = { title: "Actividades pro-fondos" };

// DIR-ASA-12 (HU-ASA-08 a 10): todas las actividades pro-fondos, aparte de las asambleas, con un filtro por estado. Cada una
// abre sus ingresos y gastos, donde se publica su balance.
export default async function ActividadesDirectiva({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const [actividades, balances, { estado }] = await Promise.all([
    verActividades(sesion),
    balancesPublicados(sesion),
    searchParams,
  ]);
  const publicadas = new Set(balances.flatMap((b) => (b.convocatoriaId ? [b.convocatoriaId] : [])));
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Actividades pro-fondos"
        descripcion="Polladas, bingos y rifas para juntar fondos. Abra una para ver sus ingresos y gastos y publicar su balance."
        accion={
          <BotonEnlace href="/directiva/actividades/nueva" icono={CirclePlus} anchoCompleto>
            Nueva actividad pro-fondos
          </BotonEnlace>
        }
      />
      <ListaDeActividades
        actividades={actividades}
        publicadas={publicadas}
        filtro={estado}
        ruta="/directiva/actividades"
        textoFiltro={{
          proximas: "Próximas",
          "por-publicar": "Balance por publicar",
          publicadas: "Balance publicado",
        }}
      />
    </div>
  );
}
