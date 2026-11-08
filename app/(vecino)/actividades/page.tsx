import type { Metadata } from "next";
import { ListaDeActividades } from "@/app/_actividades/ListaDeActividades";
import { exigirActor } from "@/app/_sesion/sesion";
import { EncabezadoPagina } from "@/componentes/a11y/EncabezadoPagina";
import { verActividades } from "@/modulos/asambleas/aplicacion/actividades";
import { balancesPublicados } from "@/modulos/transparencia/aplicacion/balances";

export const metadata: Metadata = { title: "Actividades pro-fondos" };

// VEC-ASA-13 (HU-ASA-08): todas las actividades pro-fondos, aparte de las asambleas, con un filtro. Cada una abre su detalle:
// cómo colaborar si es próxima, o su balance si ya se publicó.
export default async function Actividades({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
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
        descripcion="Eventos para juntar fondos para el barrio. Puede colaborar pagando o ayudando como voluntaria, y ver en qué se gastó."
      />
      <ListaDeActividades
        actividades={actividades}
        publicadas={publicadas}
        filtro={estado}
        ruta="/actividades"
        soloPublicas
        textoFiltro={{
          proximas: "Próximas",
          "por-publicar": "Ya se hicieron",
          publicadas: "Con balance publicado",
        }}
      />
    </div>
  );
}
