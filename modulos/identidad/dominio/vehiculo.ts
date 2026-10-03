// @HU-GAR-01 @HU-GAR-10
// Vehículo del diagrama 02a: la garita lo encuentra por su placa (HU-GAR-06). Se pide una placa por cada
// auto y cada moto que se declara; los triciclos y carretas no llevan placa.
import { normalizarPlaca } from "./visita";

export type TipoVehiculoPlaca = "AUTO_O_CAMIONETA" | "MOTO";
export type Placas = { autos: string[]; motos: string[] };

const GRUPOS = [
  { clave: "autos", tipo: "AUTO_O_CAMIONETA", falta: (n: number) => `Escriba la placa del auto ${n}.` },
  { clave: "motos", tipo: "MOTO", falta: (n: number) => `Escriba la placa de la moto ${n}.` },
] as const;

const FORMA_VALIDA = /^[A-Z0-9]{5,7}$/;

/** Revisa que haya una placa válida por vehículo declarado. Los errores van por `placas.autos.0`, etc. */
export function prepararPlacas(cantidades: { autos: number; motos: number }, placas: Placas) {
  const errores: Record<string, string> = {};
  const vehiculos: { tipo: TipoVehiculoPlaca; placa: string }[] = [];
  const vistas = new Set<string>();
  for (const { clave, tipo, falta } of GRUPOS) {
    // Una cantidad fuera del contador ya se avisa en su propio campo: no se piden placas por ella.
    const cantidad = Number.isInteger(cantidades[clave]) && cantidades[clave] <= 9 ? cantidades[clave] : 0;
    for (let i = 0; i < cantidad; i++) {
      const campo = `placas.${clave}.${i}`;
      const escrita = (placas[clave][i] ?? "").trim();
      if (!escrita) {
        errores[campo] = falta(i + 1);
        continue;
      }
      const placa = normalizarPlaca(escrita);
      if (!FORMA_VALIDA.test(placa.replace("-", ""))) {
        errores[campo] = "La placa tiene entre 5 y 7 letras o números, por ejemplo ABC-123.";
      } else if (vistas.has(placa)) {
        errores[campo] = "Esta placa está repetida en esta vivienda.";
      } else {
        vistas.add(placa);
        vehiculos.push({ tipo, placa });
      }
    }
  }
  return { errores, vehiculos };
}
