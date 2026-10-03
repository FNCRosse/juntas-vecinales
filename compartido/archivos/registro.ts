import { prisma } from "../bd/cliente";
import { ErrorNoEncontrado } from "../errores";
import { firmarDescarga, prepararSubida, type UsoArchivo } from "./r2";

// Registro de los archivos subidos a R2 (`nucleo_archivos`): quién subió cada uno y para qué. La URL
// firmada de subida se pide solo tras validar tipo y tamaño en el servidor; la de descarga, solo tras
// comprobar que la persona puede verlo (AC-7).

/** Valida el archivo, anota quién lo sube y devuelve la URL firmada de `PUT` de 5 minutos. */
export async function pedirSubida(
  quien: string,
  archivo: { tipo: string; tamano: number },
  datos: { uso: string; carpeta: string; clase: UsoArchivo },
) {
  const subida = prepararSubida(archivo, datos.clase, datos.carpeta);
  const fila = await prisma.archivo.create({
    data: {
      clave: subida.clave,
      tipo: archivo.tipo,
      tamano: archivo.tamano,
      uso: datos.uso,
      subidoPor: quien,
    },
  });
  return { id: fila.id, ...subida };
}

/** Los archivos que esa persona subió para ese uso: es lo que otro módulo puede enlazar a su registro. */
export async function archivosSubidosPor(quien: string, uso: string, ids: string[]) {
  const filas = await prisma.archivo.findMany({ where: { id: { in: ids }, subidoPor: quien, uso } });
  return new Set(filas.map((f) => f.id));
}

/** Firma la descarga si el archivo existe y `puedeVer` lo permite; si no, responde como inexistente (AC-7). */
export async function descargarSiPuede(
  id: string,
  puedeVer: (archivo: { uso: string; subidoPor: string }) => boolean,
) {
  const fila = await prisma.archivo.findUnique({ where: { id } });
  if (!fila || !puedeVer(fila)) throw new ErrorNoEncontrado();
  return firmarDescarga(fila.clave);
}
