// Instantánea del padrón en la tablet (AC-4, FRONTEND.md §6): IndexedDB nativo, sin librerías.
// Los DNI llegan como hash SHA-256; el número escrito se compara con su hash.

import type { ResultadoConsulta } from "@/modulos/identidad/aplicacion/garita";

export type Instantanea = {
  generadaEn: string;
  casas: (ResultadoConsulta & { dnis: string[] })[];
};

const BASE = "garita";
const ALMACEN = "instantanea";

function abrir() {
  return new Promise<IDBDatabase>((resolver, rechazar) => {
    const pedido = indexedDB.open(BASE, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(ALMACEN);
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  });
}

async function usar<T>(modo: IDBTransactionMode, accion: (almacen: IDBObjectStore) => IDBRequest<T>) {
  const base = await abrir();
  return new Promise<T>((resolver, rechazar) => {
    const pedido = accion(base.transaction(ALMACEN, modo).objectStore(ALMACEN));
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  }).finally(() => base.close());
}

export const guardarInstantanea = (datos: Instantanea) => usar("readwrite", (a) => a.put(datos, "ultima"));

export const leerInstantanea = () =>
  usar<Instantanea | undefined>("readonly", (a) => a.get("ultima")).catch(() => undefined);

/** Pide la lista al servidor y la guarda. Sin red no hace nada: queda la anterior. */
export async function refrescarInstantanea() {
  try {
    const respuesta = await fetch("/api/garita/instantanea", { cache: "no-store" });
    if (respuesta.ok) await guardarInstantanea(await respuesta.json());
  } catch {
    // Sin internet: se sigue con la lista guardada.
  }
}

async function sha256(texto: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

const compacto = (texto: string) => texto.toUpperCase().replace(/[^A-Z0-9]/g, "");
const sinTildes = (texto: string) => texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/** La misma búsqueda que en el servidor, sobre la lista guardada: DNI, placa o nombre. */
export async function buscarEnInstantanea(instantanea: Instantanea, texto: string) {
  const limpio = texto.trim();
  if (/^\d{8}$/.test(limpio)) {
    const hash = await sha256(limpio);
    return instantanea.casas.filter((c) => c.dnis.includes(hash));
  }
  const placa = compacto(limpio);
  const porPlaca = instantanea.casas.filter((c) => c.placas.some((p) => compacto(p) === placa));
  if (porPlaca.length)
    return porPlaca.map((c) => ({ ...c, placa: c.placas.find((p) => compacto(p) === placa) ?? null }));
  const nombre = sinTildes(limpio);
  return instantanea.casas
    .filter(
      (c) =>
        c.residentes.some((r) => sinTildes(r).includes(nombre)) || sinTildes(c.vivienda).includes(nombre),
    )
    .map((c) => ({ ...c, quien: c.residentes.find((r) => sinTildes(r).includes(nombre)) ?? c.quien }));
}
