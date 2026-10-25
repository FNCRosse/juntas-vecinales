// @HU-COB-15
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { soles } from "@/compartido/dinero";
import { detalleDeRecaudacion, FILTROS_DE_ESTADO } from "@/modulos/aportes/aplicacion/tablero";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { csvDeRecaudacion, BOM, nombreDeArchivo } from "@/modulos/transparencia/dominio/exportacion";

const horaDeLima = (fecha: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  }).format(fecha);

/**
 * Exporta la recaudación a un CSV (HU-COB-15): el rango de fechas y el estado de las casas que pide la directiva (CA1), con los
 * mismos totales y desgloses del tablero y el detalle por casa (CA2). Cada exportación queda en el historial de acciones con
 * quién la hizo y cuándo (CA3), en la misma transacción que la entrega: si no se puede registrar, no se entrega. Solo la
 * directiva exporta, porque el archivo trae lo que paga cada casa. Excel abre el CSV; no se arma un .xlsx para no sumar una
 * dependencia por el mismo contenido.
 */
export async function exportarRecaudacion(
  sesion: SesionDto,
  entrada: { desde?: string; hasta?: string; estado?: string },
  ahora = new Date(),
) {
  const { tablero, casas } = await detalleDeRecaudacion(sesion, entrada, ahora);
  const estado = FILTROS_DE_ESTADO.find((f) => f.valor === tablero.estado)?.etiqueta ?? tablero.estado;
  const contenido =
    BOM +
    csvDeRecaudacion({
      generado: horaDeLima(ahora).replace(",", ""),
      periodo: tablero.periodo,
      estado,
      tablero,
      casas,
    });
  await prisma.$transaction((tx) =>
    registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "exportar_recaudacion",
        entidad: "Recaudacion",
        entidadId: `${tablero.periodo.desde}..${tablero.periodo.hasta}`,
        antes: null,
        despues: {
          periodo: `${tablero.periodo.desde} a ${tablero.periodo.hasta}`,
          estado,
          formato: "CSV",
          recibos: tablero.recibos,
          cobrado: soles(tablero.seCobro),
        },
      },
      tx,
    ),
  );
  return { contenido, nombre: nombreDeArchivo(tablero.periodo.desde, tablero.periodo.hasta) };
}
