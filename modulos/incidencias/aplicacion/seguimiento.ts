// @HU-QUE-09
import { createHash } from "node:crypto";
import { ErrorEnPausa, ErrorNoEncontrado } from "@/compartido/errores";
import { fechaYHora } from "@/compartido/fechas";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { CATEGORIAS, ESTADOS, numeroVisible } from "@/modulos/incidencias/dominio/queja";
import {
  normalizarCodigo,
  pasosDelAvance,
  superaLimite,
  VENTANA_CONSULTAS_MS,
} from "@/modulos/incidencias/dominio/seguimiento";
import { hashDenunciante } from "@/modulos/incidencias/infraestructura/identidadProtegida";
import {
  anotarConsulta,
  buscarPorCodigo,
  buscarPorId,
} from "@/modulos/incidencias/infraestructura/repositorioSeguimiento";

export const MENSAJE_CODIGO_NO_ENCONTRADO =
  "No encontramos un reporte con ese código. Revíselo en su constancia y vuelva a escribirlo.";
export const MENSAJE_MUCHAS_CONSULTAS =
  "Hizo muchas búsquedas seguidas. Espere 15 minutos y vuelva a intentarlo, o pregunte a la directiva.";

type Fila = NonNullable<Awaited<ReturnType<typeof buscarPorCodigo>>>;

/**
 * El avance de un reporte (VEC-QUE-08): número, categoría, manzana, estado y fechas. No muestra la
 * descripción, la referencia ni quién reportó: nada que hable de otras personas (HU-QUE-09 CA3).
 */
const avanceADto = (q: Fila) => {
  const fecha = fechaYHora(q.fechaRegistro);
  return {
    numero: numeroVisible(q.numero),
    codigo: q.codigoTicket,
    categoria: CATEGORIAS[q.categoria],
    lugar: q.manzana ? `Mz. ${q.manzana}` : "Otro lugar del barrio",
    estado: q.estado,
    estadoTexto: ESTADOS[q.estado],
    fechaRegistro: q.fechaRegistro.toISOString(),
    pasos: pasosDelAvance(q.estado, fecha),
  };
};
export type AvanceDto = ReturnType<typeof avanceADto>;

const hashDeIp = (ip: string) => createHash("sha256").update(`seguimiento:${ip}`).digest("hex");

/**
 * Consulta por código sin sesión (HU-QUE-09 CA1): sirve para el reporte anónimo y el asistido. Limita los
 * intentos por conexión para que nadie adivine códigos; un código que no existe responde 404.
 */
export async function consultarPorCodigo(texto: string, ip: string, ahora = new Date()) {
  const recientes = await anotarConsulta(hashDeIp(ip), ahora, VENTANA_CONSULTAS_MS);
  if (superaLimite(recientes - 1)) throw new ErrorEnPausa(MENSAJE_MUCHAS_CONSULTAS);
  const queja = await buscarPorCodigo(normalizarCodigo(texto));
  if (!queja) throw new ErrorNoEncontrado(MENSAJE_CODIGO_NO_ENCONTRADO);
  return avanceADto(queja);
}

/** El avance de uno de sus propios reportes, desde "Mis reportes". El de otra persona responde 404 (AC-7). */
export async function verMiQueja(sesion: SesionDto, id: string) {
  exigirRol(sesion, "VECINO", "VECINO_ADULTO_MAYOR");
  const queja = await buscarPorId(id);
  const esSuya =
    queja &&
    (queja.denuncianteId === sesion.usuarioId ||
      queja.identidadProtegida?.hashDenunciante === hashDenunciante(sesion.usuarioId));
  if (!esSuya) throw new ErrorNoEncontrado();
  return avanceADto(queja);
}
