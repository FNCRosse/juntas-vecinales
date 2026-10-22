// @HU-COB-16
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type { TipoCambioTarifa, UnidadCobro } from "@/compartido/bd/generado/client";

const conConceptos = { conceptos: { orderBy: { orden: "asc" } } } as const;

export type VersionDeTarifa = NonNullable<Awaited<ReturnType<typeof tarifaPorIdOperacion>>>;

/** Todas las versiones de la tarifa, de la más antigua a la más nueva por vigencia y por registro. */
export const versionesDeTarifa = () =>
  prisma.tarifa.findMany({
    include: conConceptos,
    orderBy: [{ vigenciaDesde: "asc" }, { creadaEn: "asc" }],
  });

export const tarifaPorIdOperacion = (idOperacion: string) =>
  prisma.tarifa.findUnique({ where: { idOperacion }, include: conConceptos });

export const crearVersionDeTarifa = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    vigenciaDesde: Date;
    acta: string;
    tipoCambio: TipoCambioTarifa;
    cambioClave: string;
    cambioNombre: string;
    cambioUnidad: UnidadCobro;
    montoAnterior: number | null;
    montoNuevo: number;
    autorId: string;
    autor: string;
    creadaEn: Date;
    conceptos: { clave: string; nombre: string; unidad: UnidadCobro; monto: number }[];
  },
) => {
  const { conceptos, ...version } = datos;
  return tx.tarifa.create({
    data: { ...version, conceptos: { create: conceptos.map((c, orden) => ({ ...c, orden })) } },
    include: conConceptos,
  });
};
