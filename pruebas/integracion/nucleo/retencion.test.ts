import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { depurarVencidos, haceDias } from "@/compartido/retencion";

// El trigger de la bitácora compara con el reloj de la BD: las fechas se arman desde ahora.
const ahora = new Date();
let usuarioId: string;
let predioId: string;

const bitacora = (fecha: Date, quien: string) =>
  prisma.registroAcceso.create({
    data: { fecha, tipo: "ENTRADA", modo: "VISITA", quien, vivienda: "Mz. A, lote 12", vigilanteId: "v" },
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios CASCADE`;
  await sembrar("clave-de-prueba");
  const marta = await prisma.usuario.findUniqueOrThrow({
    where: { dni: "40000002" },
    include: { residencias: true },
  });
  usuarioId = marta.id;
  predioId = marta.residencias[0].predioId;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-INFRA Retención de datos (DATOS.md §6)", () => {
  it("@HU-INFRA borra la bitácora y las visitas de más de un año, y nada más reciente", async () => {
    const vieja = await bitacora(haceDias(ahora, 400), "Visita de hace 400 días");
    const reciente = await bitacora(haceDias(ahora, 300), "Visita de hace 300 días");
    const visita = (dias: number) =>
      prisma.visita.create({
        data: {
          predioId,
          registradaPor: usuarioId,
          nombre: `Hace ${dias}`,
          desde: haceDias(ahora, dias),
          hasta: haceDias(ahora, dias),
        },
      });
    const visitaVieja = await visita(400);
    const visitaReciente = await visita(10);

    const resultado = await depurarVencidos(ahora);
    expect(resultado.bitacora).toBeGreaterThanOrEqual(1);
    expect(await prisma.registroAcceso.findUnique({ where: { id: vieja.id } })).toBeNull();
    expect(await prisma.registroAcceso.findUnique({ where: { id: reciente.id } })).not.toBeNull();
    expect(await prisma.visita.findUnique({ where: { id: visitaVieja.id } })).toBeNull();
    expect(await prisma.visita.findUnique({ where: { id: visitaReciente.id } })).not.toBeNull();

    // HU-GAR-08 CA3: lo de menos de un año sigue sin poder borrarse ni editarse.
    await expect(prisma.registroAcceso.delete({ where: { id: reciente.id } })).rejects.toThrow();
    await expect(
      prisma.registroAcceso.update({ where: { id: reciente.id }, data: { quien: "Otra" } }),
    ).rejects.toThrow();
  });

  it("@HU-INFRA borra enlaces y sesiones vencidos hace más de 30 días", async () => {
    const enlace = (venceHace: number) =>
      prisma.magicLink.create({
        data: {
          usuarioId,
          tokenHash: `h-${venceHace}-${Math.random()}`,
          expiraEn: haceDias(ahora, venceHace),
        },
      });
    const enlaceViejo = await enlace(40);
    const enlaceReciente = await enlace(10);
    const sesion = (datos: { revocadaEn?: Date; ultimoUsoEn?: Date }) =>
      prisma.sesion.create({ data: { usuarioId, tokenHash: `s-${Math.random()}`, ...datos } });
    const revocadaVieja = await sesion({ revocadaEn: haceDias(ahora, 40) });
    const revocadaReciente = await sesion({ revocadaEn: haceDias(ahora, 5) });
    const sinUso = await sesion({ ultimoUsoEn: haceDias(ahora, 500) });
    const activa = await sesion({ ultimoUsoEn: haceDias(ahora, 100) });

    expect(await depurarVencidos(ahora)).toMatchObject({ enlaces: 1, sesiones: 2 });
    expect(await prisma.magicLink.findUnique({ where: { id: enlaceViejo.id } })).toBeNull();
    expect(await prisma.magicLink.findUnique({ where: { id: enlaceReciente.id } })).not.toBeNull();
    const quedan = await prisma.sesion.findMany({ where: { usuarioId }, select: { id: true } });
    expect(quedan.map((s) => s.id).sort()).toEqual([revocadaReciente.id, activa.id].sort());
    expect([revocadaVieja.id, sinUso.id].some((id) => quedan.some((s) => s.id === id))).toBe(false);
  });
});
