import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado } from "@/compartido/errores";
import { calcularDeuda, miCuota } from "@/modulos/aportes/aplicacion/deuda";
import { cambiarTarifa } from "@/modulos/aportes/aplicacion/tarifa";
import { lunesDe } from "@/modulos/aportes/dominio/cuota";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { ejecutarTareas } from "@/worker/ejecutor";

// Lunes 28 de setiembre de 2026, 10:00 a. m. en Lima. La tarifa de las semillas ya rige desde abril.
const LUNES_28 = new Date("2026-09-28T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const LUNES_5 = new Date("2026-10-05T15:00:00Z");
const LUNES_12 = new Date("2026-10-12T15:00:00Z");

let marta: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let ana: SesionDto;
let pedro: SesionDto;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const cuotaDe = async (dni: string, periodo = "2026-09-28") => {
  const residencia = await prisma.residencia.findFirstOrThrow({
    where: { usuario: { dni }, fechaFin: null },
  });
  return prisma.cuota.findFirstOrThrow({
    where: { predioId: residencia.predioId, periodo: new Date(`${periodo}T05:00:00Z`) },
    include: { conceptos: { orderBy: { orden: "asc" } } },
  });
};

const avisosDe = async (dni: string) => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return prisma.avisoEnCola.findMany({
    where: { destinatarioId: u.id, titulo: { contains: "cuota de la semana" } },
  });
};

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas CASCADE`;
  await sembrar("clave-de-prueba");
  marta = await sesionDe("40000002");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  ana = await sesionDe("40000001");
  pedro = await sesionDe("40000003");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-01 CA1 La cuota de cada casa con la tarifa vigente", () => {
  it("@HU-COB-01 CA1 emite una cuota por casa: Σ monto del concepto × lo que hay en el predio", async () => {
    expect(await calcularDeuda(LUNES_28)).toMatchObject({ cuotas: 6, avisos: 6, vencidas: 0 });
    expect(await prisma.cuota.count()).toBe(6);
    const carmenCuota = await cuotaDe("08123478");
    expect(carmenCuota).toMatchObject({ montoCalculado: 500, saldoPendiente: 500, estado: "PENDIENTE" });
    expect(carmenCuota.conceptos.map((c) => [c.nombre, c.cantidad, c.montoUnitario, c.subtotal])).toEqual([
      ["Casa", 1, 250, 250],
      ["Inquilino", 1, 250, 250],
    ]);
    expect((await cuotaDe("40000006")).montoCalculado).toBe(450); // casa + 1 auto
    expect((await cuotaDe("40000008")).montoCalculado).toBe(550); // casa + auto + moto
    expect((await cuotaDe("40000002")).montoCalculado).toBe(250);
  });

  it("@HU-COB-01 CA1 una casa sin residentes vigentes no recibe cuota", async () => {
    const victor = await prisma.residencia.findFirstOrThrow({
      where: { usuario: { dni: "40000009" }, fechaFin: null },
    });
    await prisma.residencia.update({ where: { id: victor.id }, data: { fechaFin: LUNES_21 } });
    expect(await calcularDeuda(LUNES_28)).toMatchObject({ cuotas: 5 });
  });

  it("@HU-COB-01 sin tarifa registrada no se emite nada", async () => {
    await prisma.$executeRaw`TRUNCATE aportes_conceptos_tarifa, aportes_tarifas CASCADE`;
    expect(await calcularDeuda(LUNES_28)).toEqual({ cuotas: 0, avisos: 0, vencidas: 0 });
    expect(await prisma.cuota.count()).toBe(0);
  });
});

describe("@HU-COB-01 CA2 El aviso de cobro", () => {
  it("@HU-COB-01 CA2 cada vecino de la casa recibe su aviso con el monto, la semana y la fecha límite", async () => {
    await calcularDeuda(LUNES_28);
    const [aviso, ...otros] = await avisosDe("08123478");
    expect(otros).toEqual([]);
    expect(aviso).toMatchObject({
      tipo: "PAGOS",
      titulo: "Su cuota de la semana: S/ 5.00",
      texto:
        "Semana del 28 de setiembre al 4 de octubre. Puede pagarla hasta el domingo 4 de octubre de 2026. Véala en Mi cuota.",
    });
    // Marta es directiva y también vive en una casa: recibe el de su casa.
    expect((await avisosDe("40000002"))[0].titulo).toBe("Su cuota de la semana: S/ 2.50");
  });

  it("@HU-COB-01 CA2 quien no vive en una casa del padrón no recibe aviso de cobro", async () => {
    await calcularDeuda(LUNES_28);
    for (const dni of ["40000001", "40000003", "40000004"]) expect(await avisosDe(dni)).toEqual([]);
    expect(await prisma.avisoEnCola.count()).toBe(6);
  });
});

describe("@HU-COB-01 CA3 La deuda queda registrada con trazabilidad", () => {
  it("@HU-COB-01 CA3 guarda el periodo, la fecha límite, la versión de la tarifa y cuándo se calculó", async () => {
    await calcularDeuda(LUNES_28);
    const cuota = await cuotaDe("40000008");
    const vigente = await prisma.tarifa.findFirstOrThrow({ where: { idOperacion: "semilla-tarifa-2" } });
    expect(cuota.tarifaId).toBe(vigente.id);
    expect(cuota.periodo.toISOString()).toBe("2026-09-28T05:00:00.000Z");
    expect(cuota.fechaLimite.toISOString()).toBe("2026-10-05T04:59:59.000Z");
    expect(cuota.creadaEn).toBeInstanceOf(Date);
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "calcular_deuda", entidadId: "2026-09-28" },
      // La auditoría es de solo inserción: quedan las filas de las demás pruebas; esta es la última.
      orderBy: { fecha: "desc" },
    });
    expect(auditoria).toMatchObject({
      actorId: null,
      despues: { semana: "Semana del 28 de setiembre al 4 de octubre", cuotas: 6, avisos: 6 },
    });
  });

  it("@HU-COB-01 la copia de lo que se cobró no se edita ni se borra", async () => {
    await calcularDeuda(LUNES_28);
    await expect(prisma.$executeRaw`UPDATE aportes_cuota_conceptos SET "montoUnitario" = 1`).rejects.toThrow(
      /solo admite inserciones/,
    );
    await expect(prisma.$executeRaw`DELETE FROM aportes_cuota_conceptos`).rejects.toThrow(
      /solo admite inserciones/,
    );
  });

  it("@HU-COB-16 CA3 un cambio de tarifa no toca las cuotas ya emitidas; la semana siguiente usa el monto nuevo", async () => {
    await calcularDeuda(LUNES_28);
    await cambiarTarifa(
      marta,
      {
        concepto: "auto",
        monto: 300,
        vigencia: "2026-10-05",
        acta: "Acta de asamblea del 20 de setiembre de 2026",
        idOperacion: randomUUID(),
      },
      LUNES_28,
    );
    await calcularDeuda(LUNES_5);
    const vieja = await cuotaDe("40000006", "2026-09-28");
    const nueva = await cuotaDe("40000006", "2026-10-05");
    expect(vieja.montoCalculado).toBe(450);
    expect(vieja.conceptos.find((c) => c.clave === "auto")?.montoUnitario).toBe(200);
    expect(nueva.montoCalculado).toBe(550);
    expect(nueva.conceptos.find((c) => c.clave === "auto")?.montoUnitario).toBe(300);
  });
});

describe("@HU-COB-01 La tarea es idempotente y se recupera", () => {
  it("@HU-COB-01 AC-5 correrla varias veces, o dos a la vez, no duplica cuotas ni avisos", async () => {
    await calcularDeuda(LUNES_28);
    expect(await calcularDeuda(LUNES_28)).toMatchObject({ cuotas: 0, avisos: 0 });
    await prisma.$executeRaw`TRUNCATE aportes_cuota_conceptos, aportes_cuotas, nucleo_cola_avisos CASCADE`;
    await Promise.all([calcularDeuda(LUNES_28), calcularDeuda(LUNES_28)]);
    expect(await prisma.cuota.count()).toBe(6);
    expect(await prisma.avisoEnCola.count()).toBe(6);
  });

  it("@HU-COB-01 si el worker no corrió una semana, la recupera, pero avisa solo de la actual", async () => {
    await calcularDeuda(LUNES_28);
    await prisma.avisoEnCola.deleteMany();
    expect(await calcularDeuda(LUNES_12)).toMatchObject({ cuotas: 12, avisos: 6 });
    expect(await prisma.cuota.count({ where: { predioId: (await cuotaDe("08123478")).predioId } })).toBe(3);
  });

  it("@HU-COB-01 las cuotas que pasaron su fecha límite quedan vencidas", async () => {
    await calcularDeuda(LUNES_28);
    expect(await calcularDeuda(LUNES_5)).toMatchObject({ cuotas: 6, vencidas: 6 });
    expect((await cuotaDe("08123478", "2026-09-28")).estado).toBe("VENCIDA");
    expect((await cuotaDe("08123478", "2026-10-05")).estado).toBe("PENDIENTE");
  });

  it("@HU-COB-01 el worker la corre junto con las demás tareas y deja su resultado", async () => {
    const resultado = await ejecutarTareas();
    expect(resultado.estado).toBe("ejecutada");
    const ejecucion = await prisma.ejecucionWorker.findFirstOrThrow({ orderBy: { iniciadaEn: "desc" } });
    expect(JSON.parse(ejecucion.detalle ?? "{}").deuda).toMatchObject({ cuotas: 6 });
    expect(
      await prisma.cuota.count({ where: { periodo: new Date(`${lunesDe(new Date())}T05:00:00Z`) } }),
    ).toBe(6);
  });
});

describe("@HU-COB-01 CA1 Mi cuota", () => {
  it("@HU-COB-01 CA1 la casa ve lo que debe semana por semana y cómo se calcula su cuota semanal", async () => {
    await calcularDeuda(LUNES_21);
    await calcularDeuda(LUNES_28);
    const cuota = await miCuota(carmen);
    expect(cuota).toMatchObject({
      vivienda: "Mz. C, lote 7",
      debe: 1000,
      porSemana: 500,
      semanas: [
        expect.objectContaining({
          semana: "Semana del 21 al 27 de setiembre",
          // Ya pasó su fecha límite (domingo 27) cuando corre la semana del 28.
          estado: "Con retraso",
          monto: 500,
        }),
        expect.objectContaining({ semana: "Semana del 28 de setiembre al 4 de octubre", monto: 500 }),
      ],
      conceptos: [
        expect.objectContaining({ nombre: "Casa", cantidad: 1, monto: 250 }),
        expect.objectContaining({ nombre: "Inquilino", cantidad: 1, monto: 250 }),
      ],
    });
  });

  it("@HU-COB-01 las cuotas vencidas se dicen «Con retraso», sin decir moroso", async () => {
    await calcularDeuda(LUNES_28);
    await calcularDeuda(LUNES_5);
    const { semanas } = (await miCuota(carmen))!;
    expect(semanas.map((s) => s.estado)).toEqual(["Con retraso", "Pendiente"]);
  });

  it("@HU-COB-01 AC-7 cada casa ve solo lo suyo, y quien no vive en una casa no ve nada", async () => {
    await calcularDeuda(LUNES_28);
    const deJulio = (await miCuota(julio))!;
    expect(deJulio.debe).toBe(450);
    expect(deJulio.vivienda).toBe("Mz. A, lote 3");
    expect(JSON.stringify(deJulio)).not.toContain("Inquilino");
    expect(await miCuota(pedro)).toBeNull();
    await expect(miCuota(ana)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-COB-01 sin cuotas todavía, la casa debe cero y no hay conceptos", async () => {
    expect(await miCuota(carmen)).toMatchObject({ debe: 0, semanas: [], conceptos: [], porSemana: 0 });
  });
});
