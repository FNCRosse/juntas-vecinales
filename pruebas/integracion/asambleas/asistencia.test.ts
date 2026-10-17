import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  cancelarAsistencia,
  confirmarAsistencia,
  miAsistencia,
  proximaAsamblea,
  publicarConvocatoria,
} from "@/modulos/asambleas/aplicacion/convocatorias";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const ANTES = new Date("2026-12-01T12:00:00Z");
const DESPUES = new Date("2026-12-20T12:00:00Z");

let directiva: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let asambleaId: string;

async function sesionDe(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, asambleas_convocatorias, asambleas_asambleas, asambleas_confirmaciones CASCADE`;
  await sembrar("clave-de-prueba");
  directiva = await sesionDe("40000002");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  const { asamblea } = await publicarConvocatoria(
    directiva,
    {
      tipoAsamblea: "ORDINARIA",
      fechaHora: new Date("2026-12-14T23:00:00Z"),
      lugar: "Local comunal",
      motivo: "Aprobar el presupuesto.",
      idOperacion: randomUUID(),
    },
    ANTES,
  );
  asambleaId = asamblea.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-02 Confirmar asistencia", () => {
  it("@HU-ASA-02 CA1 el vecino confirma y su casa suma al quórum", async () => {
    const dto = await confirmarAsistencia(carmen, asambleaId, ANTES);
    expect(dto.confirmados).toEqual({ digital: 1, asistida: 0, total: 1 });
    expect(await miAsistencia(carmen, asambleaId)).toBe(true);
  });

  it("@HU-ASA-02 CA2 una sola confirmación por predio aunque se repita", async () => {
    await confirmarAsistencia(carmen, asambleaId, ANTES);
    await confirmarAsistencia(carmen, asambleaId, ANTES);
    expect(await prisma.confirmacionAsistencia.count({ where: { convocatoriaId: asambleaId } })).toBe(1);
  });

  it("@HU-ASA-02 CA1 cada predio suma una vez: dos vecinos de casas distintas dan 2", async () => {
    await confirmarAsistencia(carmen, asambleaId, ANTES);
    const dto = await confirmarAsistencia(julio, asambleaId, ANTES);
    expect(dto.confirmados.total).toBe(2);
  });

  it("@HU-ASA-02 CA3 el vecino edita su respuesta hasta el plazo", async () => {
    await confirmarAsistencia(carmen, asambleaId, ANTES);
    const dto = await cancelarAsistencia(carmen, asambleaId, ANTES);
    expect(dto.confirmados.total).toBe(0);
    expect(await miAsistencia(carmen, asambleaId)).toBe(false);
  });

  it("@HU-ASA-02 CA3 pasado el plazo ya no se puede confirmar", async () => {
    await expect(confirmarAsistencia(carmen, asambleaId, DESPUES)).rejects.toThrow(/plazo/i);
  });

  it("@HU-ASA-02 el quórum proyectado refleja las confirmaciones", async () => {
    await confirmarAsistencia(carmen, asambleaId, ANTES);
    await confirmarAsistencia(julio, asambleaId, ANTES);
    const proxima = await proximaAsamblea(directiva, ANTES);
    expect(proxima?.confirmados.total).toBe(2);
  });

  it("@HU-ASA-02 AC-6 audita la confirmación", async () => {
    await confirmarAsistencia(carmen, asambleaId, ANTES);
    const auditoria = await prisma.registroAuditoria.findFirst({
      where: { accion: "confirmar_asistencia", entidadId: asambleaId },
    });
    expect(auditoria?.actorId).toBe(carmen.usuarioId);
  });
});
