import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  anularAsistenciaAsistida,
  buscarParaAsistencia,
  confirmarAsistencia,
  proximaAsamblea,
  publicarConvocatoria,
  registrarAsistenciaAsistida,
} from "@/modulos/asambleas/aplicacion/convocatorias";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const AHORA = new Date("2026-12-01T12:00:00Z");

let mediador: SesionDto;
let directiva: SesionDto;
let carmen: SesionDto;
let vecino: SesionDto;
let asambleaId: string;
let predioCarmen: string;
let predioJulio: string;

async function sesionDe(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

async function predioDe(dni: string) {
  const r = await prisma.residencia.findFirstOrThrow({
    where: { usuario: { dni }, fechaFin: null },
  });
  return r.predioId;
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, asambleas_convocatorias, asambleas_asambleas, asambleas_confirmaciones CASCADE`;
  await sembrar("clave-de-prueba");
  mediador = await sesionDe("40000003");
  directiva = await sesionDe("40000002");
  carmen = await sesionDe("08123478");
  vecino = await sesionDe("40000006");
  predioCarmen = await predioDe("08123478");
  predioJulio = await predioDe("40000006");
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

describe("@HU-ASA-03 Confirmación asistida por el mediador", () => {
  it("@HU-ASA-03 CA1 el mediador busca al vecino por nombre o por DNI", async () => {
    const porNombre = await buscarParaAsistencia(mediador, asambleaId, "carmen");
    expect(porNombre.map((v) => v.predioId)).toContain(predioCarmen);
    const porDni = await buscarParaAsistencia(mediador, asambleaId, "08123478");
    expect(porDni.map((v) => v.predioId)).toContain(predioCarmen);
  });

  it("@HU-ASA-03 CA1 la búsqueda no muestra el DNI completo", async () => {
    const [encontrado] = await buscarParaAsistencia(mediador, asambleaId, "08123478");
    expect(encontrado.dniTerminadoEn).toBe("78");
    expect(JSON.stringify(encontrado)).not.toContain("08123478");
  });

  it("@HU-ASA-03 CA2 acredita la confirmación al predio, como gestionada presencialmente", async () => {
    await registrarAsistenciaAsistida(mediador, asambleaId, predioCarmen, AHORA);
    const fila = await prisma.confirmacionAsistencia.findFirstOrThrow({
      where: { convocatoriaId: asambleaId, predioId: predioCarmen },
    });
    expect(fila.modo).toBe("ASISTIDA");
    expect(fila.registradaPor).toBe(mediador.usuarioId);
  });

  it("@HU-ASA-03 CA3 suma al indicador de asistencia preliminar, separada de la digital", async () => {
    await confirmarAsistencia(vecino, asambleaId, AHORA);
    await registrarAsistenciaAsistida(mediador, asambleaId, predioCarmen, AHORA);
    const proxima = await proximaAsamblea(mediador, AHORA);
    expect(proxima?.confirmados).toEqual({ digital: 1, asistida: 1, total: 2 });
  });

  it("@HU-ASA-03 una confirmación digital del vecino no se pisa con la del mediador", async () => {
    await confirmarAsistencia(vecino, asambleaId, AHORA);
    await registrarAsistenciaAsistida(mediador, asambleaId, predioJulio, AHORA);
    const fila = await prisma.confirmacionAsistencia.findFirstOrThrow({
      where: { convocatoriaId: asambleaId, predioId: predioJulio },
    });
    expect(fila.modo).toBe("DIGITAL");
  });

  it("@HU-ASA-03 el mediador puede anular su propio registro, no el de la app", async () => {
    await registrarAsistenciaAsistida(mediador, asambleaId, predioCarmen, AHORA);
    await anularAsistenciaAsistida(mediador, asambleaId, predioCarmen, AHORA);
    expect(await prisma.confirmacionAsistencia.count({ where: { predioId: predioCarmen } })).toBe(0);

    await confirmarAsistencia(vecino, asambleaId, AHORA);
    await expect(anularAsistenciaAsistida(mediador, asambleaId, predioJulio, AHORA)).rejects.toThrow();
  });

  it("@HU-ASA-03 AC-6 audita quién registró la asistencia", async () => {
    await registrarAsistenciaAsistida(mediador, asambleaId, predioCarmen, AHORA);
    const auditoria = await prisma.registroAuditoria.findFirst({
      where: { accion: "registrar_asistencia_asistida", entidadId: asambleaId },
    });
    expect(auditoria?.actorId).toBe(mediador.usuarioId);
  });

  it("@HU-ASA-03 solo el mediador o la directiva pueden asentar la asistencia", async () => {
    await expect(registrarAsistenciaAsistida(vecino, asambleaId, predioCarmen, AHORA)).rejects.toThrow();
    await expect(buscarParaAsistencia(carmen, asambleaId, "ana")).rejects.toThrow();
    expect(await prisma.confirmacionAsistencia.count()).toBe(0);
  });

  it("@HU-ASA-03 pasado el plazo ya no se puede asentar", async () => {
    await expect(
      registrarAsistenciaAsistida(mediador, asambleaId, predioCarmen, new Date("2026-12-20T12:00:00Z")),
    ).rejects.toThrow(/plazo/i);
  });
});
