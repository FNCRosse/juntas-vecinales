// @HU-COB-11
// Cola local de cobros en efectivo (R-05, FRONTEND.md §6): cada cobro se guarda primero en el teléfono, con su
// identificador, y se manda al servidor en cuanto hay señal. El servidor es idempotente por `idOperacionLocal`, así que
// reintentar es seguro. IndexedDB nativo, sin librerías.
import { enviarJson } from "@/app/_formularios/enviar";

export type CobroGuardado = {
  idOperacionLocal: string;
  pedidoId: string;
  nombre: string;
  vivienda: string;
  /** Céntimos. */
  monto: number;
  reciboEnPapel: boolean;
  /** Cuándo recibió el dinero (hora del teléfono, ISO). */
  registradoEn: string;
  estado: "pendiente" | "sincronizado" | "con_problema";
  mensaje?: string;
  reciboId?: string;
  reciboNumero?: string;
  excedente?: number;
  alDia?: boolean;
  debeAhora?: number;
};

const BASE = "cobros";
const ALMACEN = "cola";
const RECIENTES = 30;

function abrir() {
  return new Promise<IDBDatabase>((resolver, rechazar) => {
    const pedido = indexedDB.open(BASE, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(ALMACEN, { keyPath: "idOperacionLocal" });
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

const guardar = (cobro: CobroGuardado) => usar("readwrite", (a) => a.put(cobro));

/** Todos los cobros de este teléfono, el más reciente primero; de los ya sincronizados quedan los últimos. */
export async function listarCobros() {
  const todos = await usar<CobroGuardado[]>("readonly", (a) => a.getAll()).catch(() => []);
  const ordenados = todos.sort((a, b) => b.registradoEn.localeCompare(a.registradoEn));
  const sincronizados = ordenados.filter((c) => c.estado === "sincronizado").slice(RECIENTES);
  await Promise.all(sincronizados.map((c) => usar("readwrite", (a) => a.delete(c.idOperacionLocal))));
  return ordenados.filter((c) => !sincronizados.includes(c));
}

export const leerCobro = (idOperacionLocal: string) =>
  usar<CobroGuardado | undefined>("readonly", (a) => a.get(idOperacionLocal));

/** Guarda el cobro como pendiente de sincronizar. Esto nunca necesita red. */
export const guardarCobro = (cobro: Omit<CobroGuardado, "estado">) =>
  guardar({ ...cobro, estado: "pendiente" });

type RespuestaDelCobro = {
  recibo: { id: string; numero: string } | null;
  excedente: number;
  alDia: boolean;
  debeAhora: number;
};

let enCurso: Promise<void> | null = null;

/**
 * Manda los cobros pendientes, del más antiguo al más nuevo. Sin señal se detiene y quedan guardados; si el servidor
 * rechaza uno (ya estaba cobrado, no tiene permiso), queda marcado con su motivo y sigue con el siguiente. Si ya hay un
 * envío en marcha, espera a ese.
 */
export function sincronizarCobros() {
  enCurso ??= enviarPendientes().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

async function enviarPendientes() {
  const pendientes = (await listarCobros()).filter((c) => c.estado === "pendiente").reverse();
  for (const cobro of pendientes) {
    const r = await enviarJson<RespuestaDelCobro>("/api/aportes/pagos/presencial", "POST", {
      idOperacionLocal: cobro.idOperacionLocal,
      pedidoId: cobro.pedidoId,
      monto: cobro.monto,
      reciboEnPapel: cobro.reciboEnPapel,
      registradoEn: cobro.registradoEn,
    });
    if (r.ok) {
      await guardar({
        ...cobro,
        estado: "sincronizado",
        mensaje: undefined,
        reciboId: r.datos.recibo?.id,
        reciboNumero: r.datos.recibo?.numero,
        excedente: r.datos.excedente,
        alDia: r.datos.alDia,
        debeAhora: r.datos.debeAhora,
      });
    } else if (r.estado === 0) {
      return; // Sin señal: el resto sigue guardado.
    } else if (r.estado >= 500 || r.estado === 401) {
      return; // El servidor no pudo ahora, o hay que volver a entrar: se reintenta después.
    } else {
      await guardar({ ...cobro, estado: "con_problema", mensaje: r.error });
    }
  }
}
