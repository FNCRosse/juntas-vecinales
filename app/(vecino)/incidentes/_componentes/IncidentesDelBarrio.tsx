// @HU-QUE-08 @HU-ACC-07
import { List, Map, Table } from "lucide-react";
import { ICONO_CATEGORIA as ICONOS } from "@/app/_incidentes/iconos";
import { fechaCorta } from "@/compartido/fechas";
import { InsigniaDeEstado } from "@/app/_incidentes/InsigniaDeEstado";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { PERIODOS_DEL_MAPA, type MapaDto, type PeriodoDelMapa } from "@/modulos/incidencias/aplicacion/mapa";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";

// VEC-QUE-01, 02 y 03: los incidentes del barrio como lista, como mapa por manzanas o como tabla. El mapa
// lleva su descripción en texto y la lista y la tabla dicen lo mismo sin depender de la vista (HU-ACC-07).
// Los íconos son decorativos: el tipo siempre está escrito al lado.

export const VISTAS = {
  lista: { etiqueta: "Lista", detalle: "Los reportes uno debajo del otro", Icono: List },
  mapa: { etiqueta: "Mapa", detalle: "Dónde pasó cada uno", Icono: Map },
  resumen: { etiqueta: "Resumen", detalle: "Cuántos hay por zona y tipo", Icono: Table },
} as const;
export type Vista = keyof typeof VISTAS;

const TIPOS = ["RUIDOS", "BASURA", "COCHERAS", "SEGURIDAD", "OTROS"] as const;
const CORTO = {
  RUIDOS: "Ruido",
  BASURA: "Basura",
  COCHERAS: "Cocheras",
  SEGURIDAD: "Seguridad",
  OTROS: "Otros",
} as const;

// Mapa de calor: el fondo cambia con la cantidad, y la cantidad siempre se dice en palabras (WCAG 1.4.1).
const CALOR = {
  ninguno: { clase: "bg-fondo-superficie border-borde-sutil", texto: "Sin reportes" },
  pocos: { clase: "bg-fondo-info border-borde-info", texto: "Pocos reportes" },
  varios: { clase: "bg-fondo-aviso border-borde-aviso", texto: "Varios reportes" },
  muchos: { clase: "bg-fondo-error border-borde-error", texto: "Muchos reportes" },
} as const;

const cantidad = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

const enlace = (vista: Vista, periodo: PeriodoDelMapa) => `/incidentes?vista=${vista}&periodo=${periodo}`;

export function IncidentesDelBarrio({
  mapa,
  vista,
  periodo,
}: {
  mapa: MapaDto;
  vista: Vista;
  periodo: PeriodoDelMapa;
}) {
  const { totales } = mapa;
  const { etiqueta: nombreDelPeriodo, frase, de } = PERIODOS_DEL_MAPA[periodo];
  return (
    <section aria-labelledby="titulo-barrio" className="flex flex-col gap-4">
      <h2 id="titulo-barrio" className="text-titulo-2">
        En el barrio · {nombreDelPeriodo.toLowerCase()}
      </h2>
      <SelectorDeFiltro
        id="periodo-incidentes"
        pregunta="Periodo"
        valor={periodo}
        opciones={(Object.keys(PERIODOS_DEL_MAPA) as PeriodoDelMapa[]).map((clave) => ({
          valor: clave,
          etiqueta: PERIODOS_DEL_MAPA[clave].etiqueta,
          href: enlace(vista, clave),
        }))}
      />
      <SelectorDeFiltro
        id="vista-incidentes"
        pregunta="Ver los incidentes como"
        valor={vista}
        opciones={(Object.keys(VISTAS) as Vista[]).map((clave) => ({
          valor: clave,
          etiqueta: VISTAS[clave].etiqueta,
          detalle: VISTAS[clave].detalle,
          href: enlace(clave, periodo),
        }))}
      />
      <p>
        {cantidad(totales.total, "reporte", "reportes")}:{" "}
        {cantidad(totales.resueltos, "resuelto", "resueltos")},{" "}
        {cantidad(totales.derivados, "derivado", "derivados")} a otra entidad y {totales.enRevision} en
        revisión. Se muestran solo por manzana, sin la casa de quien reportó.
      </p>

      {vista === "lista" &&
        (mapa.recientes.length ? (
          <ListaVerMas
            etiqueta={`Incidentes ${de}`}
            elementos={mapa.recientes.map((r, i) => {
              const Icono = ICONOS[r.categoria];
              return (
                <div
                  key={`${r.fecha}-${i}`}
                  className="flex gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6"
                >
                  <Icono aria-hidden className="size-icono shrink-0 text-accion-primaria" />
                  <span className="flex flex-col gap-1">
                    <strong>{r.tipo}</strong>
                    <span className="text-texto-secundario">
                      {r.zona} · {fechaCorta(new Date(r.fecha), { conAnio: false })}
                    </span>
                    <InsigniaDeEstado estado={r.clave} texto={r.estado} />
                  </span>
                </div>
              );
            })}
          />
        ) : (
          <p role="status">No hay reportes validados en {frase}.</p>
        ))}

      {vista === "mapa" && (
        <figure className="flex flex-col gap-3">
          <div role="img" aria-label={mapa.descripcion.etiqueta} className="grid grid-cols-2 gap-separacion">
            {mapa.zonas.map((z) => (
              <div
                key={z.zona}
                className={`flex min-h-24 flex-col gap-1 rounded-control border-(length:--borde-ancho-control) p-3 ${CALOR[z.intensidad].clase}`}
              >
                <strong>{z.zona}</strong>
                <span className="text-pequeno">{CALOR[z.intensidad].texto}</span>
                {TIPOS.filter((t) => z.porTipo[t] > 0).map((t) => {
                  const Icono = ICONOS[t];
                  return (
                    <span key={t} className="inline-flex items-center gap-1 text-pequeno">
                      <Icono aria-hidden className="size-icono-pequeno shrink-0" />
                      {CORTO[t]}: {z.porTipo[t]}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          <figcaption>
            Descripción del mapa: {mapa.descripcion.resumen} Vea la lista o el resumen para leerlo sin el
            mapa.
          </figcaption>
        </figure>
      )}

      {vista === "resumen" && (
        // La tabla puede ser más ancha que el teléfono: la región se enfoca para moverla con el teclado.
        <div
          tabIndex={0}
          role="region"
          aria-label="Tabla de reportes por zona y tipo"
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse text-left">
            <caption className="mb-2 text-left font-bold">Reportes {de} por zona y tipo</caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-borde-fuerte p-2">
                  Zona
                </th>
                {TIPOS.map((t) => (
                  <th key={t} scope="col" className="border-b border-borde-fuerte p-2">
                    {CORTO[t]}
                  </th>
                ))}
                <th scope="col" className="border-b border-borde-fuerte p-2">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {mapa.zonas.map((z) => (
                <tr key={z.zona}>
                  <th scope="row" className="border-b border-borde-sutil p-2">
                    {z.zona}
                  </th>
                  {TIPOS.map((t) => (
                    <td key={t} className="border-b border-borde-sutil p-2">
                      {z.porTipo[t]}
                    </td>
                  ))}
                  <td className="border-b border-borde-sutil p-2 font-bold">{z.total}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="p-2">
                  Todo el barrio
                </th>
                {TIPOS.map((t) => (
                  <td key={t} className="p-2 font-bold">
                    {totales.porTipo[t]}
                  </td>
                ))}
                <td className="p-2 font-bold">{totales.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
