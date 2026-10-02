import { randomUUID } from "node:crypto";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";

afterAll(async () => {
  await prisma.$disconnect();
});

// La tabla no admite TRUNCATE: cada prueba usa su propio entidadId.
const entrada = (entidadId: string) => ({
  actorId: randomUUID(),
  accion: "cambiar_tarifa",
  entidad: "Tarifa",
  entidadId,
  antes: { casa: 250 },
  despues: { casa: 300 },
});

describe("@HU-INFRA AC-6 Auditoría consolidada", () => {
  it("@HU-INFRA AC-6 guarda actor, fecha, entidad y los valores previos y posteriores", async () => {
    const id = randomUUID();
    const { fecha } = await prisma.$transaction((tx) => registrarAuditoria(entrada(id), tx));

    const fila = await prisma.registroAuditoria.findFirstOrThrow({ where: { entidadId: id } });
    expect(fila).toMatchObject({
      accion: "cambiar_tarifa",
      entidad: "Tarifa",
      antes: { casa: 250 },
      despues: { casa: 300 },
    });
    expect(fila.actorId).toBeTruthy();
    expect(fila.fecha).toEqual(fecha);
  });

  it("@HU-INFRA AC-6 un alta guarda antes vacío y el sistema actúa sin actor", async () => {
    const id = randomUUID();
    await prisma.$transaction((tx) => registrarAuditoria({ ...entrada(id), actorId: null, antes: null }, tx));
    const fila = await prisma.registroAuditoria.findFirstOrThrow({ where: { entidadId: id } });
    expect(fila.actorId).toBeNull();
    expect(fila.antes).toBeNull();
  });

  it("@HU-INFRA AC-6 si la transacción se deshace, la auditoría también", async () => {
    const id = randomUUID();
    await expect(
      prisma.$transaction(async (tx) => {
        await registrarAuditoria(entrada(id), tx);
        throw new Error("la acción falló");
      }),
    ).rejects.toThrow("la acción falló");
    expect(await prisma.registroAuditoria.count({ where: { entidadId: id } })).toBe(0);
  });

  it("@HU-INFRA AC-6 la tabla solo admite inserciones: UPDATE, DELETE y TRUNCATE fallan", async () => {
    const id = randomUUID();
    await prisma.$transaction((tx) => registrarAuditoria(entrada(id), tx));

    await expect(
      prisma.registroAuditoria.updateMany({ where: { entidadId: id }, data: { accion: "otra" } }),
    ).rejects.toThrow(/solo admite inserciones/);
    await expect(prisma.registroAuditoria.deleteMany({ where: { entidadId: id } })).rejects.toThrow(
      /solo admite inserciones/,
    );
    await expect(prisma.$executeRaw`TRUNCATE nucleo_auditoria`).rejects.toThrow(/solo admite inserciones/);
    expect(await prisma.registroAuditoria.count({ where: { entidadId: id } })).toBe(1);
  });
});
