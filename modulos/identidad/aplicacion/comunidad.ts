// @HU-ASA-15
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import type { Transaccion } from "@/compartido/bd/cliente";
import { contarPadron, quitarUnidadDeOcupacion } from "@/modulos/identidad/infraestructura/repositorioPadron";
import {
  idsDeVecinosActivos,
  prediosConOcupacion,
  prediosConResidentes,
  prediosConResidentesVigentes,
  vecinosPorNombreODni,
} from "@/modulos/identidad/infraestructura/repositorioUsuarios";
import { direccion, RUBRO_DE_CONCEPTO } from "@/modulos/identidad/dominio/predio";
import { viviendaDe } from "@/modulos/identidad/infraestructura/repositorioVisitas";

/** Puerto para M2 y los demás módulos: a quién le llega lo que se publica a toda la comunidad. */
export const vecinosDeLaComunidad = (tx: Transaccion) => idsDeVecinosActivos(tx);

/** Puerto para M4: el total de predios del padrón vigente, base del quórum (un voto por predio, HU-ASA-04). */
export const totalDePredios = async () => (await contarPadron()).predios;

/** Puerto para M4: el predio del vecino (su residencia vigente) con su vivienda en texto, o null si no está. */
export async function predioDelVecino(usuarioId: string) {
  const predio = await viviendaDe(usuarioId);
  return predio ? { id: predio.id, vivienda: direccion(predio), estadoGarita: predio.estadoGarita } : null;
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
      {
        vivienda: direccion(p),
        nombre: p.residencias[0]?.usuario.nombreCompleto ?? "Sin residentes",
        // A quiénes avisarles lo que pasa con la casa, y si la garita le abre la reja sola (HU-COB-07).
        residentes: p.residencias.map((r) => r.usuarioId),
        estadoGarita: p.estadoGarita,
      },
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

/**
 * Puerto para M5 (HU-COB-04): cuando la directiva aprueba un reclamo de cuota («ya no tengo inquilino»), el padrón se corrige
 * en la misma transacción para que las cuotas que vienen ya no cobren esa unidad. Quita una del rubro del concepto y lo deja
 * en el historial del predio como un cambio de ocupación hecho por esa persona. Con los vehículos solo baja el contador:
 * quitar la placa que ya no está sigue siendo de la administración. `null` si no hay nada que quitar.
 */
export async function quitarUnaUnidadDeOcupacion(
  predioId: string,
  clave: string,
  actorId: string,
  tx: Transaccion,
) {
  const rubro = RUBRO_DE_CONCEPTO[clave as keyof typeof RUBRO_DE_CONCEPTO];
  if (!rubro || rubro === "familias") return null;
  const cambio = await quitarUnidadDeOcupacion(tx, predioId, rubro);
  if (!cambio) return null;
  await registrarAuditoria(
    {
      actorId,
      accion: "actualizar_predio",
      entidad: "Predio",
      entidadId: predioId,
      antes: { [rubro]: cambio.antes },
      despues: { [rubro]: cambio.despues },
    },
    tx,
  );
  return cambio;
}

/** Puerto para M5 (HU-GAR-10): lo que hay registrado hoy en una casa con residentes, por clave de concepto; `null` si no figura. */
export async function ocupacionDeLaCasa(predioId: string) {
  return (await ocupacionDeLasCasas()).find((c) => c.predioId === predioId)?.ocupacion ?? null;
}
