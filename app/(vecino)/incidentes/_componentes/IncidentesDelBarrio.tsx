// @HU-QUE-08 @HU-ACC-07
import { Car, Check, CircleHelp, Info, List, Map, ShieldAlert, Table, Trash2, Volume2 } from "lucide-react";
import Link from "next/link";
import { fechaLarga } from "@/compartido/fechas";
import type { MapaDto } from "@/modulos/incidencias/aplicacion/mapa";

// VEC-QUE-01, 02 y 03: los incidentes del barrio como lista, como mapa por manzanas o como tabla. El mapa
// lleva su descripción en texto y la lista y la tabla dicen lo mismo sin depender de la vista (HU-ACC-07).
// Los íconos son decorativos: el tipo siempre está escrito al lado.

export const VISTAS = {
  lista: { etiqueta: "Lista", Icono: List },
  mapa: { etiqueta: "Mapa", Icono: Map },
  resumen: { etiqueta: "Resumen", Icono: Table },
} as const;
export type Vista = keyof typeof VISTAS;

const ICONOS = {
  RUIDOS: Volume2,
  BASURA: Trash2,
  COCHERAS: Car,
  SEGURIDAD: ShieldAlert,
  OTROS: CircleHelp,
} as const;
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

export function IncidentesDelBarrio({ mapa, vista }: { mapa: MapaDto; vista: Vista }) {
  const { totales } = mapa;
  return (
    <section aria-labelledby="titulo-barrio" className="flex flex-col gap-4">
      <h2 id="titulo-barrio" className="text-titulo-2">
        En el barrio · último mes
      </h2>
      <nav aria-label="Ver incidentes como" className="grid grid-cols-3 gap-separacion">
        {(Object.keys(VISTAS) as Vista[]).map((clave) => {
          const { etiqueta, Icono } = VISTAS[clave];
          const activa = clave === vista;
          return (
            <Link
              key={clave}
              href={`/incidentes?vista=${clave}`}
              scroll={false}
              aria-current={activa ? "true" : undefined}
              className={`inline-flex min-h-tactil items-center justify-center gap-1 rounded-control border-(length:--borde-ancho-control) px-1 font-bold no-underline ${activa ? "border-accion-primaria bg-accion-primaria text-texto-invertido" : "border-borde-control bg-fondo-superficie text-accion-primaria hover:bg-accion-secundaria-hover"}`}
            >
              {activa ? (
                <Check aria-hidden className="size-icono-pequeno" />
              ) : (
                <Icono aria-hidden className="size-icono-pequeno" />
              )}
              {etiqueta}
            </Link>
          );
        })}
      </nav>
      <p>
        {cantidad(totales.total, "reporte", "reportes")}:{" "}
        {cantidad(totales.resueltos, "resuelto", "resueltos")},{" "}
        {cantidad(totales.derivados, "derivado", "derivados")} a otra entidad y {totales.enRevision} en
        revisión. Se muestran solo por manzana, sin la casa de quien reportó.
      </p>

      {vista === "lista" &&
        (mapa.recientes.length ? (
          <ul className="flex flex-col gap-separacion" aria-label="Incidentes del último mes">
            {mapa.recientes.map((r, i) => {
              const Icono = ICONOS[r.categoria];
              return (
                <li
                  key={`${r.fecha}-${i}`}
                  className="flex gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6"
                >
                  <Icono aria-hidden className="size-icono shrink-0 text-accion-primaria" />
                  <span className="flex flex-col gap-1">
                    <strong>{r.tipo}</strong>
                    <span className="text-texto-secundario">
                      {r.zona} · {fechaLarga(new Date(r.fecha))}
                    </span>
                    <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
                      <Info aria-hidden className="size-icono-pequeno" />
                      {r.estado}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p role="status">No hay reportes validados en el último mes.</p>
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
            <caption className="mb-2 text-left font-bold">Reportes del último mes por zona y tipo</caption>
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
