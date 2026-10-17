import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  confirmarAsistencia,
  proximaAsamblea,
  publicarConvocatoria,
} from "@/modulos/asambleas/aplicacion/convocatorias";
import { avisarCorteDeQuorum } from "@/modulos/asambleas/aplicacion/quorum";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { ejecutarTareas } from "../../../worker/ejecutor";

const AHORA = new Date("2026-12-01T12:00:00Z");
// El plazo cierra la víspera a las 8:00 p. m. de Lima: el 13 de diciembre, 01:00 UTC del 14.
const DESPUES_DEL_CORTE = new Date("2026-12-14T02:00:00Z");

let directiva: SesionDto;
let carmen: SesionDto;
let asambleaId: string;

async function sesionDe(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

const avisosDeCorte = () =>
  prisma.avisoEnCola.findMany({
    where: { tipo: "ASAMBLEAS", titulo: { startsWith: "Quórum proyectado" } },
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, asambleas_convocatorias, asambleas_asambleas, asambleas_confirmaciones CASCADE`;
  await sembrar("clave-de-prueba");
  directiva = await sesionDe("40000002");
  carmen = await sesionDe("08123478");
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

describe("@HU-ASA-04 Quórum proyectado y aviso al corte", () => {
  it("@HU-ASA-04 CA1 CA2 el panel proyecta el porcentaje y cuánto falta para el mínimo", async () => {
    await confirmarAsistencia(carmen, asambleaId, AHORA);
    const proxima = await proximaAsamblea(directiva, AHORA);
    const padron = await prisma.predio.count();
    expect(proxima?.quorum.confirmados).toBe(1);
    expect(proxima?.quorum.porcentaje).toBe(Math.round((1 / padron) * 100));
    expect(proxima?.quorum.alcanza).toBe(false);
    expect(proxima?.quorum.texto).toMatch(/^Falta(n)? \d+ casas? para el mínimo/);
  });

  it("@HU-ASA-04 CA3 al llegar el corte avisa a la directiva que el quórum es deficitario", async () => {
    await confirmarAsistencia(carmen, asambleaId, AHORA);
    expect(await avisarCorteDeQuorum(DESPUES_DEL_CORTE)).toBe(1);
    const avisos = await avisosDeCorte();
    const directivos = await prisma.usuario.count({
      where: { estado: "ACTIVA", roles: { hasSome: ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] } },
    });
    expect(avisos).toHaveLength(directivos);
    expect(avisos[0].texto).toContain("para el mínimo");
    expect(avisos[0].texto).toContain("reprograma");
  });

  it("@HU-ASA-04 CA3 si el quórum alcanza, el aviso lo dice y no pide decidir", async () => {
    // Con 2 casas de padrón el mínimo es 2; se fija así para llegar sin sembrar cien vecinos.
    await prisma.asamblea.update({
      where: { convocatoriaId: asambleaId },
      data: { padronTotal: 1, quorumRequerido: 1 },
    });
    await confirmarAsistencia(carmen, asambleaId, AHORA);
    await avisarCorteDeQuorum(DESPUES_DEL_CORTE);
    const [aviso] = await avisosDeCorte();
    expect(aviso.texto).toContain("Se llegó al mínimo");
    expect(aviso.texto).not.toContain("reprograma");
  });

  it("@HU-ASA-04 CA3 antes del plazo no avisa", async () => {
    expect(await avisarCorteDeQuorum(AHORA)).toBe(0);
    expect(await avisosDeCorte()).toHaveLength(0);
  });

  it("@HU-ASA-04 AC-5 el aviso sale una sola vez aunque el worker corra de nuevo", async () => {
    await avisarCorteDeQuorum(DESPUES_DEL_CORTE);
    const primero = (await avisosDeCorte()).length;
    expect(await avisarCorteDeQuorum(DESPUES_DEL_CORTE)).toBe(0);
    expect(await avisosDeCorte()).toHaveLength(primero);
  });

  it("@HU-ASA-04 CA3 la ejecución del worker corre esta tarea y la deja en su resumen", async () => {
    // La asamblea de la prueba cierra su plazo el 13 de diciembre de 2026; con la fecha real de hoy aún no
    // llega, así que se adelanta el plazo para que el worker (que usa la hora actual) la encuentre vencida.
    await prisma.asamblea.update({
      where: { convocatoriaId: asambleaId },
      data: { confirmacionesHasta: new Date(Date.now() - 60_000) },
    });
    const resultado = await ejecutarTareas();
    expect(resultado.estado).toBe("ejecutada");
    expect(await avisosDeCorte()).not.toHaveLength(0);
    const ejecucion = await prisma.ejecucionWorker.findFirstOrThrow({ orderBy: { iniciadaEn: "desc" } });
    expect(JSON.parse(ejecucion.detalle ?? "{}").avisosDeQuorum).toBe(1);
  });

  it("@HU-ASA-04 AC-6 audita el aviso como acción del sistema", async () => {
    await avisarCorteDeQuorum(DESPUES_DEL_CORTE);
    const auditoria = await prisma.registroAuditoria.findFirst({
      where: { accion: "avisar_corte_de_quorum", entidadId: asambleaId },
    });
    expect(auditoria?.actorId).toBeNull();
  });
});
