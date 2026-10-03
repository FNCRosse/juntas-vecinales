// @HU-GAR-01 @HU-GAR-10
import { direccion } from "@/modulos/identidad/dominio/predio";
import { type Placas, prepararPlacas } from "@/modulos/identidad/dominio/vehiculo";
import { buscarVehiculosPorPlaca } from "@/modulos/identidad/infraestructura/repositorioPadron";

export type { Placas };
export const SIN_PLACAS: Placas = { autos: [], motos: [] };

/**
 * Revisa las placas de una vivienda: una por auto y moto declarados, bien escritas, sin repetir y que no
 * estén ya en otra vivienda (la garita encuentra cada placa en un solo predio). `predioId` es el predio
 * que se está actualizando: sus propias placas no cuentan como repetidas.
 */
export async function revisarVehiculos(
  cantidades: { autos: number; motos: number },
  placas: Placas | undefined,
  predioId?: string,
) {
  const { errores, vehiculos } = prepararPlacas(cantidades, placas ?? SIN_PLACAS);
  const ocupadas = await buscarVehiculosPorPlaca(vehiculos.map((v) => v.placa));
  for (const [clave, lista] of [
    ["autos", placas?.autos ?? []],
    ["motos", placas?.motos ?? []],
  ] as const) {
    lista.forEach((escrita, i) => {
      const campo = `placas.${clave}.${i}`;
      const registrada = ocupadas.find(
        (o) =>
          o.predioId !== predioId &&
          o.placa.replace("-", "") === escrita.toUpperCase().replace(/[^A-Z0-9]/g, ""),
      );
      if (registrada && !errores[campo]) {
        errores[campo] =
          `Esta placa ya está registrada en ${direccion(registrada.predio)}. Revise que esté bien escrita.`;
      }
    });
  }
  return { errores, vehiculos };
}
