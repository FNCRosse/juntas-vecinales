import { prisma } from "@/compartido/bd/cliente";

const conUltimaAccion = { acciones: { orderBy: { fecha: "desc" }, take: 1 }, expediente: true } as const;

/** Anota la consulta y cuenta las de esa conexión en la ventana; borra las de hace más de un día. */
export async function anotarConsulta(ipHash: string, ahora: Date, ventanaMs: number) {
  const [, , recientes] = await prisma.$transaction([
    prisma.consultaSeguimiento.deleteMany({
      where: { fecha: { lt: new Date(ahora.getTime() - 86_400_000) } },
    }),
    prisma.consultaSeguimiento.create({ data: { ipHash, fecha: ahora } }),
    prisma.consultaSeguimiento.count({
      where: { ipHash, fecha: { gt: new Date(ahora.getTime() - ventanaMs) } },
    }),
  ]);
  return recientes;
}

export async function buscarPorCodigo(codigoTicket: string) {
  return prisma.queja.findUnique({ where: { codigoTicket }, include: conUltimaAccion });
}

export async function buscarPorId(id: string) {
  return prisma.queja.findUnique({
    where: { id },
    include: { identidadProtegida: true, ...conUltimaAccion },
  });
}
