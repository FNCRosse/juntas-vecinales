"use client";
// @HU-GAR-01 @HU-GAR-10

import { Campo } from "@/componentes/a11y/Campo";

export type PlacasEscritas = { autos: string[]; motos: string[] };

// Una placa por cada auto y cada moto que se declaró (la garita busca el vehículo por su placa, HU-GAR-06).
// Los errores llegan sin el prefijo: "autos.0", "motos.1".
export function CamposPlacas({
  autos,
  motos,
  placas,
  errores,
  alCambiar,
}: {
  autos: number;
  motos: number;
  placas: PlacasEscritas;
  errores: Record<string, string>;
  alCambiar: (placas: PlacasEscritas) => void;
}) {
  if (autos + motos === 0) return null;
  const grupos = [
    { clave: "autos", cantidad: autos, nombre: (n: number) => `Placa del auto ${n}` },
    { clave: "motos", cantidad: motos, nombre: (n: number) => `Placa de la moto ${n}` },
  ] as const;
  return (
    <section aria-labelledby="titulo-placas" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 id="titulo-placas" className="text-titulo-3">
          Placas de los vehículos
        </h2>
        <p className="text-texto-secundario">
          El vigilante busca cada vehículo por su placa. Escriba la de cada uno, tal como figura en la tarjeta
          de propiedad.
        </p>
      </div>
      {grupos.flatMap(({ clave, cantidad, nombre }) =>
        Array.from({ length: cantidad }, (_, i) => (
          <Campo
            key={`${clave}-${i}`}
            name={`placas.${clave}.${i}`}
            etiqueta={nombre(i + 1)}
            ayuda={i === 0 && clave === "autos" ? "Por ejemplo: ABC-123." : undefined}
            autoComplete="off"
            maxLength={8}
            value={placas[clave][i] ?? ""}
            error={errores[`${clave}.${i}`]}
            onChange={(e) => {
              const lista = [...placas[clave]];
              lista[i] = e.target.value.toUpperCase();
              alCambiar({ ...placas, [clave]: lista });
            }}
          />
        )),
      )}
    </section>
  );
}
