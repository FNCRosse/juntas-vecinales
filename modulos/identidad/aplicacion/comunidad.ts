// @HU-ASA-15
import type { Transaccion } from "@/compartido/bd/cliente";
import { contarPadron } from "@/modulos/identidad/infraestructura/repositorioPadron";
import {
  idsDeVecinosActivos,
  prediosConOcupacion,
  prediosConResidentes,
  prediosConResidentesVigentes,
  vecinosPorNombreODni,
} from "@/modulos/identidad/infraestructura/repositorioUsuarios";
import { direccion } from "@/modulos/identidad/dominio/predio";
import { viviendaDe } from "@/modulos/identidad/infraestructura/repositorioVisitas";

/** Puerto para M2 y los demás módulos: a quién le llega lo que se publica a toda la comunidad. */
export const vecinosDeLaComunidad = (tx: Transaccion) => idsDeVecinosActivos(tx);

/** Puerto para M4: el total de predios del padrón vigente, base del quórum (un voto por predio, HU-ASA-04). */
export const totalDePredios = async () => (await contarPadron()).predios;

/** Puerto para M4: el predio del vecino (su residencia vigente) con su vivienda en texto, o null si no está. */
export async function predioDelVecino(usuarioId: string) {
  const predio = await viviendaDe(usuarioId);
  return predio ? { id: predio.id, vivienda: direccion(predio) } : null;
}

/**
 * Puerto para M4: cada casa por su id con su vivienda («Mz. A, lote 12») y el nombre de quien la encabeza (el
 * primero que vive en ella), para las listas del pase de lista.
 */
export async function casasDe(predioIds: string[]) {
  const predios = await prediosConResidentes(predioIds);
  return new Map(
    predios.map((p) => [
      p.id,
      { vivienda: direccion(p), nombre: p.residencias[0]?.usuario.nombreCompleto ?? "Sin residentes" },
    ]),
  );
}

/**
 * Puerto para M4: vecinos por nombre o DNI para asentar su asistencia (HU-ASA-03 CA1). El DNI no sale
 * completo: solo las últimas cifras, como en el prototipo («DNI terminado en 56»).
 */
export async function buscarVecinos(texto: string) {
  const buscado = texto.trim();
  if (buscado.length < 2) return [];
  return (await vecinosPorNombreODni(buscado)).map((r) => ({
    predioId: r.predioId,
    nombre: r.usuario.nombreCompleto,
    vivienda: direccion(r.predio),
    dniTerminadoEn: r.usuario.dni.slice(-2),
  }));
}

/** El rubro de la ocupación del predio que corresponde a cada concepto de la tarifa (HU-COB-16, diagrama 02b). */
const RUBRO_DE_CONCEPTO = {
  casa: "familias",
  inquilino: "inquilinos",
  auto: "autos",
  moto: "motos",
  triciclo: "triciclos",
  negocio: "negocios",
} as const;

/**
 * Puerto para M5: las casas que pagan por un concepto de la tarifa (las que tienen esa unidad registrada) y sus
 * residentes activos, para avisarles un monto nuevo antes de que rija (HU-COB-16 CA2). Un concepto que la asamblea
 * agrega después todavía no tiene dónde registrarse en el padrón, así que no tiene casas por ahora.
 */
export async function casasQuePaganPor(clave: string) {
  const rubro = RUBRO_DE_CONCEPTO[clave as keyof typeof RUBRO_DE_CONCEPTO];
  if (!rubro) return { casas: 0, residentes: [] as string[] };
  const predios = await prediosConOcupacion(rubro);
  return {
    casas: predios.length,
    residentes: [...new Set(predios.flatMap((p) => p.residencias.map((r) => r.usuarioId)))],
  };
}

/**
 * Puerto para M5: cada casa con residentes del padrón, con lo que hay registrado en ella por clave de concepto
 * («auto»: 2), para calcular su cuota al iniciar el ciclo (HU-COB-01 CA1), y los vecinos a quienes avisarles.
 */
export async function ocupacionDeLasCasas() {
  return (await prediosConResidentesVigentes()).map((p) => ({
    predioId: p.id,
    ocupacion: Object.fromEntries(
      Object.entries(RUBRO_DE_CONCEPTO).map(([clave, rubro]) => [clave, p[rubro]]),
    ) as Record<string, number>,
    vecinos: p.residencias.map((r) => r.usuarioId),
  }));
}
