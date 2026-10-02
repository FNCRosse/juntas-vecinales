import { randomUUID } from "node:crypto";
import { ErrorValidacion } from "../errores";
import { firmarUrl } from "./firma";

// Archivos en Cloudflare R2 (docs/BACKEND.md §7): bucket privado y nunca listable; el navegador
// sube y descarga con URLs firmadas de 5 minutos que se generan tras validar en el servidor.

export const VIGENCIA_SEGUNDOS = 5 * 60;
const MB = 1024 * 1024;

/** Comprobantes y documentos aceptan foto o PDF; las evidencias de una queja, también video. */
export type UsoArchivo = "documento" | "evidencia";

const TIPOS = {
  "image/jpeg": { extension: "jpg", maximo: 5 * MB, usos: ["documento", "evidencia"] },
  "image/png": { extension: "png", maximo: 5 * MB, usos: ["documento", "evidencia"] },
  "application/pdf": { extension: "pdf", maximo: 5 * MB, usos: ["documento", "evidencia"] },
  "video/mp4": { extension: "mp4", maximo: 20 * MB, usos: ["evidencia"] },
} as const satisfies Record<string, { extension: string; maximo: number; usos: UsoArchivo[] }>;

type Entorno = Record<string, string | undefined>;

function configuracion(entorno: Entorno) {
  const { R2_ID_CUENTA, R2_BUCKET, R2_ID_CLAVE_ACCESO, R2_CLAVE_ACCESO_SECRETA } = entorno;
  if (!R2_ID_CUENTA || !R2_BUCKET || !R2_ID_CLAVE_ACCESO || !R2_CLAVE_ACCESO_SECRETA) {
    throw new Error(
      "Faltan variables de R2 (R2_ID_CUENTA, R2_BUCKET, R2_ID_CLAVE_ACCESO, R2_CLAVE_ACCESO_SECRETA)",
    );
  }
  return {
    host: `${R2_ID_CUENTA}.r2.cloudflarestorage.com`,
    bucket: R2_BUCKET,
    credenciales: { idClave: R2_ID_CLAVE_ACCESO, secreto: R2_CLAVE_ACCESO_SECRETA },
  };
}

/** Valida tipo y tamaño. Los mensajes dicen qué hacer, sin términos técnicos (HU-ACC-08). */
export function validarArchivo(archivo: { tipo: string; tamano: number }, uso: UsoArchivo) {
  const regla = TIPOS[archivo.tipo as keyof typeof TIPOS] as (typeof TIPOS)[keyof typeof TIPOS] | undefined;
  const permitidos =
    uso === "evidencia" ? "una foto (JPG o PNG), un PDF o un video MP4" : "una foto (JPG o PNG) o un PDF";
  if (!regla || !(regla.usos as readonly UsoArchivo[]).includes(uso)) {
    throw new ErrorValidacion(undefined, { archivo: `Este archivo no se puede subir. Elija ${permitidos}.` });
  }
  if (!Number.isInteger(archivo.tamano) || archivo.tamano <= 0) {
    throw new ErrorValidacion(undefined, { archivo: "El archivo está vacío. Elija otro." });
  }
  if (archivo.tamano > regla.maximo) {
    throw new ErrorValidacion(undefined, {
      archivo: `El archivo pesa más de ${regla.maximo / MB} MB. Elija uno más liviano o tome la foto de nuevo.`,
    });
  }
  return regla;
}

export type Subida = {
  clave: string;
  url: string;
  metodo: "PUT";
  cabeceras: Record<string, string>;
  venceEn: Date;
};

/**
 * Valida el archivo y firma la subida. La firma incluye el tipo y el tamaño: R2 rechaza un
 * archivo distinto del que se validó. `carpeta` agrupa por uso: "comprobantes", "evidencias".
 */
export function prepararSubida(
  archivo: { tipo: string; tamano: number },
  uso: UsoArchivo,
  carpeta: string,
  ahora = new Date(),
  entorno: Entorno = process.env,
): Subida {
  const regla = validarArchivo(archivo, uso);
  const { host, bucket, credenciales } = configuracion(entorno);
  const clave = `${carpeta}/${randomUUID()}.${regla.extension}`;
  const cabeceras = { "content-type": archivo.tipo, "content-length": String(archivo.tamano) };
  const url = firmarUrl(
    {
      metodo: "PUT",
      host,
      ruta: `/${bucket}/${clave}`,
      region: "auto",
      vigenciaSegundos: VIGENCIA_SEGUNDOS,
      ahora,
      cabeceras,
    },
    credenciales,
  );
  return {
    clave,
    url,
    metodo: "PUT",
    cabeceras,
    venceEn: new Date(ahora.getTime() + VIGENCIA_SEGUNDOS * 1000),
  };
}

/**
 * Firma la descarga de un archivo por su clave. Quien llama ya comprobó que la persona puede verlo
 * (AC-7): esta función no autoriza. Solo hay URLs de un objeto; nunca del bucket, que no se lista.
 */
export function firmarDescarga(clave: string, ahora = new Date(), entorno: Entorno = process.env) {
  if (!clave || clave.endsWith("/")) throw new Error("Hace falta la clave de un archivo");
  const { host, bucket, credenciales } = configuracion(entorno);
  const url = firmarUrl(
    {
      metodo: "GET",
      host,
      ruta: `/${bucket}/${clave}`,
      region: "auto",
      vigenciaSegundos: VIGENCIA_SEGUNDOS,
      ahora,
    },
    credenciales,
  );
  return { url, venceEn: new Date(ahora.getTime() + VIGENCIA_SEGUNDOS * 1000) };
}
