import { Check, HousePlus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";
import { listarPadron } from "@/modulos/identidad/aplicacion/consultarPadron";

export const metadata: Metadata = { title: "Padrón" };

type Parametros = Promise<{ q?: string; mz?: string }>;

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function enlaceFiltro(q: string | undefined, mz?: string) {
  const parametros = new URLSearchParams();
  if (q) parametros.set("q", q);
  if (mz) parametros.set("mz", mz);
  const texto = parametros.toString();
  return `/administracion/padron${texto ? `?${texto}` : ""}`;
}

// ADM-PAD-01 Padrón de viviendas y residentes (HU-GAR-01). La búsqueda va por la URL: funciona
// sin JavaScript y se puede volver atrás.
export default async function Padron({ searchParams }: { searchParams: Parametros }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const { q, mz } = await searchParams;
  const { viviendas, totales, manzanas } = await listarPadron(sesion, { texto: q, manzana: mz });
  const filtros = [
    { etiqueta: "Todas", valor: undefined },
    ...manzanas.map((m) => ({ etiqueta: `Mz. ${m}`, valor: m })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Padrón de viviendas y residentes</h1>
        <p className="text-texto-secundario">
          {plural(totales.predios, "vivienda", "viviendas")} ·{" "}
          {plural(totales.residentes, "residente", "residentes")}
        </p>
      </div>
      <BotonEnlace href="/administracion/padron/empadronar" icono={HousePlus}>
        Empadronar una vivienda
      </BotonEnlace>

      <search>
        <form method="get" className="flex flex-col gap-3">
          {mz && <input type="hidden" name="mz" value={mz} />}
          <Campo
            name="q"
            etiqueta="Buscar por nombre, DNI o lote"
            ayuda="Ejemplo: Carmen Huamán, 08123478 o Mz. C lote 7"
            defaultValue={q}
          />
          <Boton type="submit" variante="secundario" icono={Search} className="self-start">
            Buscar
          </Boton>
        </form>
      </search>

      <nav aria-label="Filtrar por manzana" className="flex flex-wrap gap-separacion">
        {filtros.map(({ etiqueta, valor }) => {
          const activo = mz === valor || (!mz && !valor);
          return (
            <Link
              key={etiqueta}
              href={enlaceFiltro(q, valor)}
              aria-current={activo ? "true" : undefined}
              className={`inline-flex min-h-tactil items-center gap-2 rounded-pastilla border-(length:--borde-ancho-control) px-4 font-bold no-underline ${activo ? "border-accion-primaria bg-accion-primaria text-texto-invertido" : "border-borde-control bg-fondo-superficie text-accion-primaria hover:bg-accion-secundaria-hover"}`}
            >
              {activo && <Check aria-hidden className="size-icono-pequeno" />}
              {etiqueta}
            </Link>
          );
        })}
      </nav>

      {viviendas.length ? (
        <ul className="flex flex-col gap-separacion" aria-label="Viviendas">
          {viviendas.map((v) => (
            <li key={v.id}>
              <TarjetaEnlace href={`/administracion/padron/${v.id}`} titulo={v.direccion}>
                <span>
                  {v.titular} · {plural(v.numeroResidentes, "residente", "residentes")}
                </span>
                <span className="text-texto-secundario">
                  {v.uso}
                  {v.ocupacion && ` · ${v.ocupacion}`}
                </span>
              </TarjetaEnlace>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status">
          {q || mz
            ? "No hay viviendas que coincidan. Revise lo que escribió o elija otra manzana."
            : "Todavía no hay viviendas en el padrón. Empadrone la primera con el botón de arriba."}
        </p>
      )}
    </div>
  );
}
