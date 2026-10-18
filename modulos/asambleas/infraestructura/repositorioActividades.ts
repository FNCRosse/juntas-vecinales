// @HU-ASA-08
import type { Transaccion } from "@/compartido/bd/cliente";
import { prisma } from "@/compartido/bd/cliente";
import type {
  EstadoColaboracion,
  ModalidadAporte,
  PagosDeActividad,
  TipoActividad,
} from "@/compartido/bd/generado/client";

const conEvento = { evento: true } as const;

export const actividadPorIdOperacion = (idOperacion: string) =>
  prisma.convocatoria.findUnique({ where: { idOperacion }, include: conEvento });

export const buscarActividad = (id: string) =>
  prisma.convocatoria.findFirst({ where: { id, tipo: "EVENTO_PRO_FONDOS" }, include: conEvento });

export function crearActividad(
  tx: Transaccion,
  datos: {
    idOperacion: string;
    titulo: string;
    motivo: string;
    fechaHora: Date;
    lugar: string;
    autorId: string;
    autor: string;
    fechaPublicacion: Date;
    tipoActividad: TipoActividad;
    precioUnidad: number;
    metaRecaudacion: number | null;
    pagos: PagosDeActividad;
    pideVoluntarios: boolean;
  },
) {
  const { tipoActividad, precioUnidad, metaRecaudacion, pagos, pideVoluntarios, ...convocatoria } = datos;
  return tx.convocatoria.create({
    data: {
      ...convocatoria,
      tipo: "EVENTO_PRO_FONDOS",
      estado: "PUBLICADA",
      evento: { create: { tipoActividad, precioUnidad, metaRecaudacion, pagos, pideVoluntarios } },
    },
    include: conEvento,
  });
}

/** Las actividades pro fondos, de la más próxima a la más lejana por su fecha. */
export const listarActividades = () =>
  prisma.convocatoria.findMany({
    where: { tipo: "EVENTO_PRO_FONDOS" },
    include: conEvento,
    orderBy: { fechaHora: "asc" },
    take: 100,
  });

export const colaboracionPorIdOperacion = (idOperacion: string) =>
  prisma.colaboracion.findUnique({ where: { idOperacion } });

export const colaboracionDePredio = (convocatoriaId: string, predioId: string) =>
  prisma.colaboracion.findUnique({ where: { convocatoriaId_predioId: { convocatoriaId, predioId } } });

export const crearColaboracion = (
  tx: Transaccion,
  datos: {
    idOperacion: string;
    convocatoriaId: string;
    predioId: string;
    autorId: string;
    cantidad: number;
    modalidad: ModalidadAporte;
    monto: number;
    estado: EstadoColaboracion;
  },
) => tx.colaboracion.create({ data: datos });

export const adjuntarComprobante = (tx: Transaccion, id: string, archivoId: string) =>
  tx.colaboracion.update({ where: { id }, data: { archivoId } });
