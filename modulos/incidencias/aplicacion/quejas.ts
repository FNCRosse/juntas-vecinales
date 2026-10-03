// @HU-QUE-01 @HU-QUE-02 @HU-QUE-03 @HU-QUE-04
import { randomInt } from "node:crypto";
import { archivosSubidosPor } from "@/compartido/archivos/registro";
import { ACTOR_ANONIMO } from "@/compartido/auditoria/acciones";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import type { EstadoQueja } from "@/compartido/bd/generado/client";
import { ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import {
  buscarVecinos,
  directivaParaAvisar,
  vecinoActivo,
  manzanaDe,
  manzanasDelBarrio,
  nombresDe,
  versionDePolitica,
} from "@/modulos/identidad/aplicacion/barrio";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  CATEGORIAS,
  codigoTicket,
  type DatosQueja,
  ESTADOS,
  lugarEnTexto,
  numeroVisible,
  prepararQueja,
  sufijoAleatorio,
} from "@/modulos/incidencias/dominio/queja";
import { cifrar, hashDenunciante } from "@/modulos/incidencias/infraestructura/identidadProtegida";
import {
  buscarPorIdOperacion,
  contarPorEstado,
  crearQueja,
  listarQuejas,
  quejasDe,
  siguienteNumero,
} from "@/modulos/incidencias/infraestructura/repositorioQuejas";

export { CATEGORIAS, ESTADOS };

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR"] as const;
const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
export const USO_EVIDENCIA = "evidencia_queja";

const anioEnLima = (fecha: Date) =>
  Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric" }).format(fecha));

type Fila = Awaited<ReturnType<typeof crearQueja>>;

/** Lo que ve quien reportó: su propio reporte, con el código para seguirlo (VEC-QUE-07). */
export const quejaADto = (q: Fila) => ({
  id: q.id,
  numero: numeroVisible(q.numero),
  codigo: q.codigoTicket,
  categoria: CATEGORIAS[q.categoria],
  descripcion: q.descripcion,
  lugar: lugarEnTexto(q.manzana, q.referencia),
  estado: q.estado,
  estadoTexto: ESTADOS[q.estado],
  fechaRegistro: q.fechaRegistro.toISOString(),
  evidencias: q.evidencias.length,
  esAnonimo: q.esAnonimo,
});
export type QuejaDto = ReturnType<typeof quejaADto>;

/** Lo que el formulario necesita para ofrecer el lugar: las manzanas y la de su casa. */
export async function lugaresParaReportar(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_VECINO);
  const [manzanas, miManzana] = await Promise.all([manzanasDelBarrio(), manzanaDe(sesion.usuarioId)]);
  return { manzanas, miManzana };
}

/** Revisa la manzana y que cada evidencia sea un archivo que subió quien registra. */
async function validar(
  quien: string,
  datos: DatosQueja,
  opciones: { asistida?: boolean } = {},
): Promise<ReturnType<typeof prepararQueja>["queja"]> {
  const { errores, queja } = prepararQueja(datos, opciones);
  if (queja.manzana && !errores.lugar && !(await manzanasDelBarrio()).includes(queja.manzana)) {
    errores.lugar = "Elija una manzana de la lista.";
  }
  if (!errores.evidencias && queja.evidencias.length) {
    const propias = await archivosSubidosPor(quien, USO_EVIDENCIA, queja.evidencias);
    if (queja.evidencias.some((id) => !propias.has(id))) {
      errores.evidencias = "Vuelva a adjuntar la foto o el video: no pudimos encontrarlo.";
    }
  }
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);
  return queja;
}

/**
 * Guarda la queja y emite su ticket (HU-QUE-04): correlativo con su código, RECIBIDO con fecha y hora,
 * aviso a la directiva y auditoría, todo en una transacción (AC-6, ADR-006). Si es anónima, el
 * denunciante queda solo cifrado (HU-QUE-02, R-09). Repetir el `idOperacion` devuelve lo registrado (AC-5).
 */
async function guardarQueja(
  queja: Awaited<ReturnType<typeof validar>>,
  quien: { denuncianteId: string; registradaPor: string | null; actorId: string },
  idOperacion: string,
  ahora: Date,
) {
  const previa = await buscarPorIdOperacion(idOperacion);
  if (previa) return { fila: previa, creada: false };

  const directiva = await directivaParaAvisar();
  const fila = await prisma.$transaction(async (tx) => {
    const numero = await siguienteNumero(tx);
    const fila = await crearQueja(tx, {
      ...queja,
      numero,
      codigoTicket: codigoTicket(anioEnLima(ahora), numero, sufijoAleatorio(randomInt)),
      fechaRegistro: ahora,
      denuncianteId: queja.esAnonimo ? null : quien.denuncianteId,
      registradaPor: quien.registradaPor,
      identidad: queja.esAnonimo
        ? {
            hashDenunciante: hashDenunciante(quien.denuncianteId),
            datosCifrados: cifrar(quien.denuncianteId),
          }
        : null,
      consentimientoVersion: versionDePolitica(),
      consentimientoEn: ahora,
      idOperacion,
    });
    const lugar = lugarEnTexto(fila.manzana, fila.referencia);
    // El aviso a la directiva no lleva el código ni el nombre de quien reporta (HU-QUE-04 CA2).
    await encolarAvisos(
      directiva.map((destinatarioId) => ({
        destinatarioId,
        tipo: "REPORTES" as const,
        titulo: "Llegó un reporte nuevo",
        texto: `${numeroVisible(numero)} · ${CATEGORIAS[fila.categoria]} en ${lugar}. Revíselo en Incidentes.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: quien.actorId,
        accion: quien.registradaPor ? "registrar_queja_asistida" : "registrar_queja",
        entidad: "Queja",
        entidadId: fila.id,
        antes: null,
        despues: {
          numero,
          categoria: fila.categoria,
          lugar,
          anonimo: fila.esAnonimo,
          evidencias: fila.evidencias.length,
          consentimiento: fila.consentimientoVersion,
        },
      },
      tx,
    );
    return fila;
  });
  return { fila, creada: true };
}

/**
 * Registra la queja del propio vecino (HU-QUE-01): exige consentimiento, categoría, descripción, lugar y
 * al menos una evidencia que subió quien reporta (CA1–CA3). En modo anónimo la auditoría no guarda quién
 * fue (HU-QUE-02).
 */
export async function registrarQueja(
  sesion: SesionDto,
  datos: DatosQueja & { idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_VECINO);
  const queja = await validar(sesion.usuarioId, datos);
  const { fila, creada } = await guardarQueja(
    queja,
    {
      denuncianteId: sesion.usuarioId,
      registradaPor: null,
      actorId: queja.esAnonimo ? ACTOR_ANONIMO : sesion.usuarioId,
    },
    datos.idOperacion,
    ahora,
  );
  return { queja: quejaADto(fila), creada };
}

/** Las manzanas para el formulario del mediador (DIR-QUE-08). */
export async function lugaresParaAsistir(sesion: SesionDto) {
  exigirRol(sesion, "DIRECTIVO_MEDIADOR");
  return manzanasDelBarrio();
}

/** Vecinos que el mediador puede elegir al registrar por ellos (DIR-QUE-08): por nombre, DNI, manzana o lote. */
export async function vecinosParaAsistir(sesion: SesionDto, texto: string) {
  exigirRol(sesion, "DIRECTIVO_MEDIADOR");
  return buscarVecinos(texto);
}

/**
 * El mediador registra la queja en nombre de un vecino (HU-QUE-03): con sus palabras, con anonimato si
 * el vecino lo pide (CA2) y sin exigir foto. `registradaPor` guarda al mediador. Devuelve los datos de
 * la constancia con el código (CA3).
 */
export async function registrarQuejaAsistida(
  sesion: SesionDto,
  datos: DatosQueja & { vecinoId: string; idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVO_MEDIADOR");
  const vecino = await vecinoActivo(datos.vecinoId);
  if (!vecino) throw new ErrorNoEncontrado("No encontramos a ese vecino. Búsquelo de nuevo.");
  const queja = await validar(sesion.usuarioId, datos, { asistida: true });
  const { fila, creada } = await guardarQueja(
    queja,
    { denuncianteId: vecino.id, registradaPor: sesion.usuarioId, actorId: sesion.usuarioId },
    datos.idOperacion,
    ahora,
  );
  return {
    queja: {
      ...quejaADto(fila),
      vecino: vecino.nombre,
      registradaPor: sesion.nombreCompleto,
    },
    creada,
  };
}
export type ConstanciaDto = Awaited<ReturnType<typeof registrarQuejaAsistida>>["queja"];

/** Los reportes de quien pregunta, los más nuevos arriba (VEC-QUE-01, "Mis reportes"). */
export async function misQuejas(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_VECINO);
  return (await quejasDe(sesion.usuarioId, hashDenunciante(sesion.usuarioId))).map(quejaADto);
}

export const FILTROS_BANDEJA = {
  todos: { etiqueta: "Todos", estados: undefined },
  porEvaluar: { etiqueta: "Por evaluar", estados: ["RECIBIDO"] },
  enRevision: { etiqueta: "En revisión", estados: ["EN_REVISION"] },
  cerrados: { etiqueta: "Cerrados", estados: ["RESUELTO", "DERIVADO_ENTIDAD_EXTERNA", "RECHAZADO"] },
} as const satisfies Record<string, { etiqueta: string; estados?: EstadoQueja[] }>;
export type FiltroBandeja = keyof typeof FILTROS_BANDEJA;

/** Quién reportó, para la directiva: el nombre, o "Reporte anónimo" sin pista alguna (HU-QUE-02 CA2). */
export const ANONIMO = "Reporte anónimo";
async function quienReporta(filas: { esAnonimo: boolean; denuncianteId: string | null }[]) {
  const nombres = await nombresDe(filas.flatMap((f) => (f.denuncianteId ? [f.denuncianteId] : [])));
  return (f: { esAnonimo: boolean; denuncianteId: string | null }) =>
    f.esAnonimo || !f.denuncianteId ? ANONIMO : (nombres.get(f.denuncianteId) ?? "Persona ya no registrada");
}

/**
 * La bandeja de la directiva (DIR-QUE-01, HU-QUE-04): todos los reportes, los más nuevos arriba, con su
 * número, quién lo envía, estado inicial y fecha y hora de llegada.
 */
export async function bandejaDeQuejas(sesion: SesionDto, filtro: FiltroBandeja = "todos") {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const estados = FILTROS_BANDEJA[filtro].estados;
  const [filas, conteo] = await Promise.all([
    listarQuejas(estados ? [...estados] : undefined),
    contarPorEstado(),
  ]);
  const quien = await quienReporta(filas);
  return {
    conteo: {
      total: Object.values(conteo).reduce((a, b) => a + b, 0),
      porEvaluar: conteo.RECIBIDO ?? 0,
      enRevision: conteo.EN_REVISION ?? 0,
    },
    quejas: filas.map((q) => ({
      id: q.id,
      numero: numeroVisible(q.numero),
      categoria: q.categoria,
      categoriaTexto: CATEGORIAS[q.categoria],
      lugar: lugarEnTexto(q.manzana, q.referencia),
      quien: quien(q),
      estado: q.estado,
      estadoTexto: ESTADOS[q.estado],
      fechaRegistro: q.fechaRegistro.toISOString(),
    })),
  };
}

/** Lo que el resumen de la directiva muestra en "Para atender" (DIR-INI-01, HU-QUE-04 CA2). */
export async function quejasPorAtender(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const conteo = await contarPorEstado();
  return { porEvaluar: conteo.RECIBIDO ?? 0, enRevision: conteo.EN_REVISION ?? 0 };
}
