import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { confirmarAsistencia, publicarConvocatoria } from "@/modulos/asambleas/aplicacion/convocatorias";
import { casoSinQuorum, registrarContingencia } from "@/modulos/asambleas/aplicacion/contingencia";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const AHORA = new Date("2026-12-01T12:00:00Z");
// El plazo cierra la víspera a las 8:00 p. m. de Lima (01:00 UTC del 14); esto es después.
const CORTE = new Date("2026-12-14T02:00:00Z");
const NUEVA = new Date("2026-12-21T23:00:00Z");

let directiva: SesionDto;
let carmen: SesionDto;
let vecino: SesionDto;
let asambleaId: string;

async function sesionDe(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

const avisosDe = (titulo: string) => prisma.avisoEnCola.findMany({ where: { tipo: "ASAMBLEAS", titulo } });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, asambleas_convocatorias, asambleas_asambleas, asambleas_confirmaciones CASCADE`;
  await sembrar("clave-de-prueba");
  directiva = await sesionDe("40000002");
  carmen = await sesionDe("08123478");
  vecino = await sesionDe("40000006");
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
  await confirmarAsistencia(carmen, asambleaId, AHORA);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-05 Contingencia por falta de quórum", () => {
  it("@HU-ASA-05 el caso sin quórum aparece al corte, no antes", async () => {
    expect(await casoSinQuorum(directiva, AHORA)).toBeNull();
    expect((await casoSinQuorum(directiva, CORTE))?.id).toBe(asambleaId);
  });

  it("@HU-ASA-05 CA1 CA2 reprogramar cambia la fecha, abre un plazo nuevo y avisa a toda la comunidad", async () => {
    const { asamblea, registrada } = await registrarContingencia(
      directiva,
      asambleaId,
      { decision: "REPROGRAMAR", nuevaFechaHora: NUEVA },
      CORTE,
    );
    expect(registrada).toBe(true);
    expect(asamblea.estado).toBe("REPROGRAMADA");
    expect(asamblea.fechaHora).toBe(NUEVA.toISOString());
    // La asamblea es el 21 a las 6:00 p. m. de Lima: el plazo cierra el 20 a las 8:00 p. m. (01:00 UTC del 21).
    expect(asamblea.confirmacionesHasta).toBe("2026-12-21T01:00:00.000Z");

    const avisos = await avisosDe("Asamblea reprogramada");
    const vecinos = await prisma.residencia.count({ where: { fechaFin: null } });
    expect(avisos).toHaveLength(vecinos);
    expect(avisos[0].texto).toContain("Local comunal");
  });

  it("@HU-ASA-05 reprogramar conserva las confirmaciones y rearma el aviso de corte", async () => {
    await registrarContingencia(
      directiva,
      asambleaId,
      { decision: "REPROGRAMAR", nuevaFechaHora: NUEVA },
      CORTE,
    );
    const fila = await prisma.asamblea.findUniqueOrThrow({ where: { convocatoriaId: asambleaId } });
    expect(fila.avisoCorteEn).toBeNull();
    expect(await prisma.confirmacionAsistencia.count({ where: { convocatoriaId: asambleaId } })).toBe(1);
  });

  it("@HU-ASA-05 CA3 la sesión informativa avisa que no habrá votaciones ni acuerdos", async () => {
    const { asamblea } = await registrarContingencia(
      directiva,
      asambleaId,
      { decision: "INFORMATIVA", nuevaFechaHora: null },
      CORTE,
    );
    expect(asamblea.estado).toBe("INFORMATIVA");
    const [aviso] = await avisosDe("La asamblea será una sesión informativa");
    expect(aviso.texto).toContain("no se votará ni se tomarán acuerdos");
  });

  it("@HU-ASA-05 AC-5 repetir la misma decisión no avisa dos veces", async () => {
    await registrarContingencia(
      directiva,
      asambleaId,
      { decision: "INFORMATIVA", nuevaFechaHora: null },
      CORTE,
    );
    const primero = (await avisosDe("La asamblea será una sesión informativa")).length;
    const otra = await registrarContingencia(
      directiva,
      asambleaId,
      { decision: "INFORMATIVA", nuevaFechaHora: null },
      CORTE,
    );
    expect(otra.registrada).toBe(false);
    expect(await avisosDe("La asamblea será una sesión informativa")).toHaveLength(primero);
  });

  it("@HU-ASA-05 AC-6 audita la decisión con el estado anterior y el nuevo", async () => {
    await registrarContingencia(
      directiva,
      asambleaId,
      { decision: "REPROGRAMAR", nuevaFechaHora: NUEVA },
      CORTE,
    );
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "reprogramar_asamblea", entidadId: asambleaId },
    });
    expect(auditoria.actorId).toBe(directiva.usuarioId);
    expect(auditoria.antes).toMatchObject({ estado: "PUBLICADA", confirmados: 1 });
    expect(auditoria.despues).toMatchObject({ estado: "REPROGRAMADA" });
  });

  it("@HU-ASA-05 no se puede decidir antes del corte", async () => {
    await expect(
      registrarContingencia(directiva, asambleaId, { decision: "INFORMATIVA", nuevaFechaHora: null }, AHORA),
    ).rejects.toThrow(/plazo para confirmar/i);
  });

  it("@HU-ASA-05 no hace falta decidir si el quórum alcanza", async () => {
    await prisma.asamblea.update({
      where: { convocatoriaId: asambleaId },
      data: { padronTotal: 1, quorumRequerido: 1 },
    });
    await expect(
      registrarContingencia(directiva, asambleaId, { decision: "INFORMATIVA", nuevaFechaHora: null }, CORTE),
    ).rejects.toThrow(/quórum sí alcanza/i);
  });

  it("@HU-ASA-05 reprogramar exige una fecha nueva a futuro", async () => {
    await expect(
      registrarContingencia(directiva, asambleaId, { decision: "REPROGRAMAR", nuevaFechaHora: null }, CORTE),
    ).rejects.toThrow();
    expect(await prisma.convocatoria.findUniqueOrThrow({ where: { id: asambleaId } })).toMatchObject({
      estado: "PUBLICADA",
    });
  });

  it("@HU-ASA-05 solo la directiva o el mediador deciden", async () => {
    await expect(
      registrarContingencia(vecino, asambleaId, { decision: "INFORMATIVA", nuevaFechaHora: null }, CORTE),
    ).rejects.toThrow();
    await expect(casoSinQuorum(vecino, CORTE)).rejects.toThrow();
  });
});
