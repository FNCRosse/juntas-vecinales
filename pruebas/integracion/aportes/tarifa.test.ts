import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { cambiarTarifa, verTarifa } from "@/modulos/aportes/aplicacion/tarifa";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

// Sábado 26 de setiembre de 2026, 10:00 a. m. en Lima: el siguiente ciclo es el lunes 28.
const AHORA = new Date("2026-09-26T15:00:00Z");
const DESPUES = new Date("2026-10-06T15:00:00Z");

let marta: SesionDto;
let pedro: SesionDto;
let carmen: SesionDto;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const cambio = (cambios: Record<string, unknown> = {}) => ({
  concepto: "auto",
  monto: 250,
  vigencia: "2026-10-05",
  acta: "Acta de asamblea del 20 de setiembre de 2026",
  idOperacion: randomUUID(),
  ...cambios,
});

const avisosDe = async (dni: string) => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return prisma.avisoEnCola.findMany({ where: { destinatarioId: u.id, titulo: { contains: "cuota" } } });
};

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, aportes_conceptos_tarifa, aportes_tarifas CASCADE`;
  await sembrar("clave-de-prueba");
  marta = await sesionDe("40000002");
  pedro = await sesionDe("40000003");
  carmen = await sesionDe("08123478");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-16 CA1 CA3 La tarifa vigente y su historial", () => {
  it("@HU-COB-16 CA1 la directiva ve los conceptos con su unidad y su monto, y puede cambiarlos", async () => {
    const tarifa = await verTarifa(marta, AHORA);
    expect(tarifa.puedeCambiar).toBe(true);
    expect(tarifa.vigente?.desde).toBe("lunes 6 de abril de 2026");
    expect(tarifa.vigente?.aprobadaEn).toBe("el acta de asamblea del 28 de marzo de 2026");
    expect(tarifa.vigente?.conceptos.map((c) => [c.nombre, c.unidadTexto, c.monto])).toEqual([
      ["Casa", "Por familia", 250],
      ["Inquilino", "Por inquilino", 250],
      ["Auto o camioneta", "Por vehículo", 200],
      ["Moto", "Por vehículo", 100],
      ["Triciclo o carreta", "Por vehículo", 50],
      ["Negocio", "Por local", 300],
    ]);
  });

  it("@HU-COB-16 CA1 el mediador la ve en solo lectura y el vecino no la ve", async () => {
    expect((await verTarifa(pedro, AHORA)).puedeCambiar).toBe(false);
    await expect(verTarifa(carmen, AHORA)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(cambiarTarifa(pedro, cambio(), AHORA)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(cambiarTarifa(carmen, cambio(), AHORA)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    expect(await prisma.tarifa.count()).toBe(3);
  });

  it("@HU-COB-16 CA3 el historial es de solo lectura, con fecha, responsable, acta y valor anterior", async () => {
    const { historial } = await verTarifa(marta, AHORA);
    expect(historial).toEqual([
      expect.objectContaining({
        texto: "Negocio: de S/ 2.50 a S/ 3.00",
        rige: "Rige desde lunes 6 de abril de 2026",
        responsable: "Marta Rojas",
        acta: "Acta de asamblea del 28 de marzo de 2026",
      }),
      expect.objectContaining({
        texto: "Se agregó Triciclo o carreta: S/ 0.50 por vehículo",
        rige: "Rige desde lunes 5 de enero de 2026",
        acta: "Acta de asamblea del 20 de diciembre de 2025",
      }),
    ]);
  });

  it("@HU-COB-16 CA3 la tabla de versiones no admite editar ni borrar", async () => {
    await expect(prisma.$executeRaw`UPDATE aportes_tarifas SET acta = 'otra'`).rejects.toThrow(
      /solo admite inserciones/,
    );
    await expect(prisma.$executeRaw`DELETE FROM aportes_conceptos_tarifa`).rejects.toThrow(
      /solo admite inserciones/,
    );
  });
});

describe("@HU-COB-16 CA2 Cambiar la tarifa", () => {
  it("@HU-COB-16 CA2 el cambio queda programado y la tarifa vigente no cambia hasta que rija", async () => {
    const { cambio: programado, creado } = await cambiarTarifa(marta, cambio(), AHORA);
    expect(creado).toBe(true);
    expect(programado).toMatchObject({
      texto: "Auto o camioneta: de S/ 2.00 a S/ 2.50",
      rige: "Rige desde lunes 5 de octubre de 2026 · programado el 26 de setiembre de 2026",
      programada: true,
    });

    const antes = await verTarifa(marta, AHORA);
    expect(antes.vigente?.conceptos.find((c) => c.clave === "auto")?.monto).toBe(200);
    expect(antes.programados).toEqual([expect.objectContaining({ desde: "lunes 5 de octubre de 2026" })]);
    expect(antes.historial[0].texto).toBe("Auto o camioneta: de S/ 2.00 a S/ 2.50");

    const despues = await verTarifa(marta, DESPUES);
    expect(despues.vigente?.conceptos.find((c) => c.clave === "auto")?.monto).toBe(250);
    expect(despues.vigente?.aprobadaEn).toBe("el acta de asamblea del 20 de setiembre de 2026");
    expect(despues.programados).toEqual([]);
  });

  it("@HU-COB-16 CA2 se avisa el monto nuevo solo a las casas que pagan por ese concepto, antes de que rija", async () => {
    const { avisadas } = await cambiarTarifa(marta, cambio(), AHORA);
    expect(avisadas).toBe(3);
    // Julio, Rosa y Elena tienen auto; Carmen y Marta no.
    for (const dni of ["40000006", "40000007", "40000008"]) {
      const [aviso, ...otros] = await avisosDe(dni);
      expect(otros).toEqual([]);
      expect(aviso).toMatchObject({
        tipo: "PAGOS",
        titulo: "Cambia la cuota de «Auto o camioneta»",
        texto:
          "Desde lunes 5 de octubre de 2026 pasa de S/ 2.00 a S/ 2.50 por semana. Las cuotas ya emitidas no cambian.",
      });
    }
    expect(await avisosDe("08123478")).toEqual([]);
    expect(await avisosDe("40000002")).toEqual([]);
  });

  it("@HU-COB-16 CA2 solo desde el siguiente ciclo, con un lunes y con su acta", async () => {
    const intento = (cambios: Record<string, unknown>) =>
      cambiarTarifa(marta, cambio(cambios), AHORA).catch((e) => e);
    const pasado = await intento({ vigencia: "2026-09-21" });
    expect(pasado).toBeInstanceOf(ErrorValidacion);
    expect(pasado.campos.vigencia).toMatch(/siguiente ciclo semanal/);
    expect((await intento({ vigencia: "2026-10-07" })).campos.vigencia).toMatch(/los lunes/);
    expect((await intento({ acta: "  " })).campos.acta).toBe("Escriba el acta de asamblea que lo aprobó.");
    expect((await intento({ monto: 200 })).campos.monto).toMatch(/mismo monto de hoy/);
    expect(await prisma.tarifa.count()).toBe(3);
    expect(await prisma.avisoEnCola.count()).toBe(0);
  });

  it("@HU-COB-16 CA2 AC-6 el cambio, los avisos y la auditoría quedan juntos", async () => {
    const { cambio: c } = await cambiarTarifa(marta, cambio(), AHORA);
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "cambiar_tarifa", entidadId: c.id },
    });
    expect(auditoria).toMatchObject({
      actorId: marta.usuarioId,
      entidad: "Tarifa",
      antes: { concepto: "Auto o camioneta", monto: "S/ 2.00" },
      despues: {
        concepto: "Auto o camioneta",
        monto: "S/ 2.50",
        vigencia: "2026-10-05",
        acta: "Acta de asamblea del 20 de setiembre de 2026",
        casas: 3,
      },
    });
  });

  it("@HU-COB-16 CA2 AC-5 repetir el envío no programa dos veces ni avisa dos veces", async () => {
    const datos = cambio();
    const { cambio: primera } = await cambiarTarifa(marta, datos, AHORA);
    const otra = await cambiarTarifa(marta, datos, AHORA);
    expect(otra.creado).toBe(false);
    expect(await prisma.tarifa.count()).toBe(4);
    expect(await prisma.avisoEnCola.count()).toBe(3);
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "cambiar_tarifa", entidadId: primera.id } }),
    ).toBe(1);
  });

  it("@HU-COB-16 AC-7 otra persona no puede reusar el identificador de un cambio ajeno", async () => {
    const datos = cambio();
    await cambiarTarifa(marta, datos, AHORA);
    const otraDirectiva = { ...pedro, roles: ["DIRECTIVA" as const] };
    await expect(cambiarTarifa(otraDirectiva, datos, AHORA)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-16 CA1 se agrega un concepto nuevo; todavía no tiene casas, así que no se avisa a nadie", async () => {
    const { cambio: c, avisadas } = await cambiarTarifa(
      marta,
      cambio({ concepto: "nuevo", nombre: "Bicicleta", unidad: "POR_VEHICULO", monto: 30 }),
      AHORA,
    );
    expect(avisadas).toBe(0);
    expect(c.texto).toBe("Se agregó Bicicleta: S/ 0.30 por vehículo");
    expect(await prisma.avisoEnCola.count()).toBe(0);
    const despues = await verTarifa(marta, DESPUES);
    expect(despues.vigente?.conceptos.map((x) => x.nombre)).toContain("Bicicleta");
    const antes = await verTarifa(marta, AHORA);
    expect(antes.vigente?.conceptos.map((x) => x.nombre)).not.toContain("Bicicleta");
  });

  it("@HU-COB-16 CA2 dos cambios para el mismo ciclo se suman; uno posterior no puede regir antes", async () => {
    await cambiarTarifa(marta, cambio({ vigencia: "2026-10-12" }), AHORA);
    await cambiarTarifa(marta, cambio({ concepto: "moto", monto: 150, vigencia: "2026-10-12" }), AHORA);
    const final = await verTarifa(marta, new Date("2026-10-13T15:00:00Z"));
    expect(
      final.vigente?.conceptos.filter((c) => ["auto", "moto"].includes(c.clave)).map((c) => c.monto),
    ).toEqual([250, 150]);
    const error = await cambiarTarifa(
      marta,
      cambio({ concepto: "casa", monto: 300, vigencia: "2026-10-05" }),
      AHORA,
    ).catch((e) => e);
    expect(error.campos.vigencia).toMatch(/Ya hay un cambio programado desde el lunes 12 de octubre de 2026/);
    // Las opciones de vigencia parten de esa fecha.
    expect((await verTarifa(marta, AHORA)).opciones.map((o) => o.dia)).toEqual([
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
    ]);
  });

  it("@HU-COB-16 CA1 sin tarifa, la directiva registra el primer concepto", async () => {
    await prisma.$executeRaw`TRUNCATE aportes_conceptos_tarifa, aportes_tarifas CASCADE`;
    const vacia = await verTarifa(marta, AHORA);
    expect(vacia.vigente).toBeNull();
    expect(vacia.conceptos).toEqual([]);
    await cambiarTarifa(
      marta,
      cambio({
        concepto: "nuevo",
        nombre: "Casa",
        unidad: "POR_FAMILIA",
        monto: 250,
        vigencia: "2026-09-28",
      }),
      AHORA,
    );
    const luego = await verTarifa(marta, new Date("2026-09-29T15:00:00Z"));
    expect(luego.vigente?.conceptos).toEqual([expect.objectContaining({ clave: "casa", monto: 250 })]);
    expect(luego.conceptos[0].casas).toBe(6);
  });

  it("@HU-COB-16 CA1 AC-7 cuenta las casas que pagan por cada concepto, sin decir cuáles", async () => {
    const { conceptos } = await verTarifa(marta, AHORA);
    expect(Object.fromEntries(conceptos.map((c) => [c.clave, c.casas]))).toEqual({
      casa: 6,
      inquilino: 1,
      auto: 3,
      moto: 1,
      triciclo: 0,
      negocio: 0,
    });
  });
});
