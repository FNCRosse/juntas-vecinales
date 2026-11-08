// @HU-ASA-10
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { TipoMovimientoActividad } from "@/compartido/bd/generado/client";

export const movimientoPorIdOperacion = (idOperacion: string) =>
  prisma.movimientoDeActividad.findUnique({ where: { idOperacion } });

/** Lo anotado de una actividad, en el orden en que se anotó. */
export const movimientosDeActividad = (convocatoriaId: string) =>
  prisma.movimientoDeActividad.findMany({
    where: { convocatoriaId },
    orderBy: { creadoEn: "asc" },
    take: 500,
  });

export const crearMovimiento = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    convocatoriaId: string;
    tipo: TipoMovimientoActividad;
    concepto: string;
    monto: number;
    archivoId: string | null;
    autorId: string;
    autor: string;
  },
) => tx.movimientoDeActividad.create({ data: datos });

/** Las colaboraciones de una actividad: cuántas unidades, cuánto y si el pago anticipado trae su comprobante. */
export const colaboracionesDeActividad = (convocatoriaId: string) =>
  prisma.colaboracion.findMany({
    where: { convocatoriaId },
    select: { cantidad: true, monto: true, modalidad: true, archivoId: true },
  });
