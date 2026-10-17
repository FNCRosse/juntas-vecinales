import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { publicarConvocatoria } from "@/modulos/asambleas/aplicacion/convocatorias";
import {
  anularDelegacion,
  constanciaDeDelegacion,
  delegarVoto,
  miDelegacion,
} from "@/modulos/asambleas/aplicacion/delegaciones";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const AHORA = new Date("2026-12-01T12:00:00Z");
const DESPUES_DEL_PLAZO = new Date("2026-12-20T12:00:00Z");

const ROSA = { nombre: "Rosa Huamán", dni: "08123456", condicion: "FAMILIAR" as const };

let directiva: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let elena: SesionDto;
let rosaB: SesionDto;
let asambleaId: string;

async function sesionDe(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, asambleas_convocatorias, asambleas_asambleas, asambleas_confirmaciones, asambleas_delegaciones CASCADE`;
  await sembrar("clave-de-prueba");
  directiva = await sesionDe("40000002");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  elena = await sesionDe("40000008");
  rosaB = await sesionDe("40000007");
  const { asamblea } = await publicarConvocatoria(
    directiva,
    {
      tipoAsamblea: "ORDINARIA",
      fechaHora: new Date("2026-12-14T23:00:00Z"),
      lugar: "Local comunal",
      motivo: "Aprobar el presupuesto.",
      idOperacion: randomUUID(),
    },
    AHORA,
  );
  asambleaId = asamblea.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-06 Delegar el voto en un apoderado", () => {
  it("@HU-ASA-06 CA1 CA2 registra nombre, DNI y condición vinculados al predio del titular", async () => {
    const { delegacion, creada } = await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    expect(creada).toBe(true);
    expect(delegacion).toMatchObject({
      apoderadoNombre: "Rosa Huamán",
      dniTerminadoEn: "56",
      condicion: "FAMILIAR",
      condicionTexto: "familiar",
    });
    const fila = await prisma.delegacionVoto.findFirstOrThrow({ where: { convocatoriaId: asambleaId } });
    const predio = await prisma.residencia.findFirstOrThrow({
      where: { usuarioId: carmen.usuarioId, fechaFin: null },
    });
    expect(fila.predioId).toBe(predio.predioId);
    expect(fila.titularId).toBe(carmen.usuarioId);
  });

  it("@HU-ASA-06 el DNI del apoderado no se guarda: solo su hash y las dos últimas cifras", async () => {
    await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    const fila = await prisma.delegacionVoto.findFirstOrThrow({ where: { convocatoriaId: asambleaId } });
    expect(JSON.stringify(fila)).not.toContain("08123456");
    expect(fila.apoderadoDniHash).toMatch(/^[0-9a-f]{64}$/);
    expect(fila.apoderadoDniFinal).toBe("56");
  });

  it("@HU-ASA-06 CA2 emite una constancia con número correlativo y la descarga en PDF", async () => {
    const { delegacion } = await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    expect(delegacion.numero).toMatch(/^D-\d{4,}$/);
    const { pdf, nombreArchivo } = await constanciaDeDelegacion(carmen, asambleaId);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(nombreArchivo).toBe(`constancia-${delegacion.numero}.pdf`);
  });

  it("@HU-ASA-06 CA3 una misma persona no representa a más de 2 casas en la asamblea", async () => {
    await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    await delegarVoto(julio, asambleaId, ROSA, AHORA);
    await expect(delegarVoto(elena, asambleaId, ROSA, AHORA)).rejects.toThrow(/ya representa a 2 casas/);
    expect(await prisma.delegacionVoto.count({ where: { convocatoriaId: asambleaId } })).toBe(2);
  });

  it("@HU-ASA-06 CA3 el límite se cuenta por persona, no por nombre: otra persona sí puede", async () => {
    await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    await delegarVoto(julio, asambleaId, ROSA, AHORA);
    await delegarVoto(elena, asambleaId, { ...ROSA, nombre: "Pedro Chávez", dni: "07654321" }, AHORA);
    expect(await prisma.delegacionVoto.count({ where: { convocatoriaId: asambleaId } })).toBe(3);
  });

  it("@HU-ASA-06 CA3 dos delegaciones a la vez a la misma persona no se pasan del límite", async () => {
    await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    const resultados = await Promise.allSettled([
      delegarVoto(julio, asambleaId, ROSA, AHORA),
      delegarVoto(elena, asambleaId, ROSA, AHORA),
      delegarVoto(rosaB, asambleaId, ROSA, AHORA),
    ]);
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.delegacionVoto.count({ where: { convocatoriaId: asambleaId } })).toBe(2);
  });

  it("@HU-ASA-06 AC-5 repetir la misma delegación no crea otra ni cambia el número", async () => {
    const primera = await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    const segunda = await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    expect(segunda.creada).toBe(false);
    expect(segunda.delegacion.numero).toBe(primera.delegacion.numero);
    expect(await prisma.delegacionVoto.count({ where: { convocatoriaId: asambleaId } })).toBe(1);
  });

  it("@HU-ASA-06 una casa no puede dejarle el voto a dos personas: primero se anula", async () => {
    await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    await expect(
      delegarVoto(carmen, asambleaId, { ...ROSA, nombre: "Pedro Chávez", dni: "07654321" }, AHORA),
    ).rejects.toThrow(/Anule esa delegación/);
    await anularDelegacion(carmen, asambleaId, AHORA);
    expect(await miDelegacion(carmen, asambleaId)).toBeNull();
    await delegarVoto(carmen, asambleaId, { ...ROSA, nombre: "Pedro Chávez", dni: "07654321" }, AHORA);
    expect((await miDelegacion(carmen, asambleaId))?.apoderadoNombre).toBe("Pedro Chávez");
  });

  it("@HU-ASA-06 AC-6 audita la delegación y la anulación", async () => {
    await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    await anularDelegacion(carmen, asambleaId, AHORA);
    const acciones = await prisma.registroAuditoria.findMany({
      where: { entidadId: asambleaId, accion: { in: ["delegar_voto", "anular_delegacion"] } },
      orderBy: { fecha: "asc" },
    });
    expect(acciones.map((a) => a.accion)).toEqual(["delegar_voto", "anular_delegacion"]);
    expect(acciones[0].actorId).toBe(carmen.usuarioId);
  });

  it("@HU-ASA-06 AC-7 un vecino no ve ni descarga la delegación de otra casa: 404", async () => {
    await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    expect(await miDelegacion(julio, asambleaId)).toBeNull();
    await expect(constanciaDeDelegacion(julio, asambleaId)).rejects.toMatchObject({ estadoHttp: 404 });
  });

  it("@HU-ASA-06 CA1 rechaza datos incompletos con mensajes en lenguaje llano", async () => {
    await expect(delegarVoto(carmen, asambleaId, { ...ROSA, dni: "123" }, AHORA)).rejects.toThrow();
    await expect(delegarVoto(carmen, asambleaId, { ...ROSA, nombre: " " }, AHORA)).rejects.toThrow();
    expect(await prisma.delegacionVoto.count()).toBe(0);
  });

  it("@HU-ASA-06 pasado el plazo ya no se puede delegar ni anular", async () => {
    await delegarVoto(carmen, asambleaId, ROSA, AHORA);
    await expect(delegarVoto(julio, asambleaId, ROSA, DESPUES_DEL_PLAZO)).rejects.toThrow(/plazo/i);
    await expect(anularDelegacion(carmen, asambleaId, DESPUES_DEL_PLAZO)).rejects.toThrow(/plazo/i);
  });
});
