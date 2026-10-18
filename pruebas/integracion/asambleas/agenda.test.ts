import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { publicarConvocatoria } from "@/modulos/asambleas/aplicacion/convocatorias";
import {
  agendaPublicada,
  bandejaDePropuestas,
  cambiarDecision,
  decidirPropuesta,
  proponerTema,
} from "@/modulos/asambleas/aplicacion/propuestas";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const PUBLICACION = new Date("2026-11-20T12:00:00Z");
const ANTES_DEL_CIERRE = new Date("2026-12-05T20:00:00Z");
const ANTES_DE_LA_ASAMBLEA = new Date("2026-12-10T12:00:00Z");
const DESPUES_DE_EMPEZAR = new Date("2026-12-15T12:00:00Z");

let directiva: SesionDto;
let mediador: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let asambleaId: string;
let luz: string;
let basura: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const proponer = async (sesion: SesionDto, titulo: string) =>
  (
    await proponerTema(
      sesion,
      asambleaId,
      { titulo, justificacion: "Es importante para el barrio.", idOperacion: randomUUID() },
      ANTES_DEL_CIERRE,
    )
  ).propuesta.id;

const avisosDe = (usuarioId: string) =>
  prisma.avisoEnCola.findMany({ where: { destinatarioId: usuarioId, tipo: "ASAMBLEAS" } });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, asambleas_convocatorias, asambleas_asambleas, asambleas_propuestas CASCADE`;
  await sembrar("clave-de-prueba");
  directiva = await sesionDe("40000002");
  mediador = await sesionDe("40000003");
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
    PUBLICACION,
  );
  asambleaId = asamblea.id;
  luz = await proponer(carmen, "Poner más luz en el pasaje");
  basura = await proponer(julio, "Cambiar el horario del camión de basura");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-14 Consolidar las propuestas en la agenda", () => {
  it("@HU-ASA-14 CA1 la directiva ve las propuestas ordenadas por fecha de envío", async () => {
    const bandeja = await bandejaDePropuestas(mediador, asambleaId);
    expect(bandeja.map((p) => p.id)).toEqual([luz, basura]);
    expect(bandeja.every((p) => p.estado === "PENDIENTE_REVISION")).toBe(true);
  });

  it("@HU-ASA-14 CA2 CA3 incluir una propuesta la anexa sola a la agenda publicada", async () => {
    expect((await agendaPublicada(mediador, asambleaId)).map((p) => p.titulo)).toEqual([
      "Aprobar el presupuesto.",
    ]);
    const { propuesta } = await decidirPropuesta(
      mediador,
      luz,
      { decision: "INCLUIR", motivo: "" },
      ANTES_DE_LA_ASAMBLEA,
    );
    expect(propuesta.estado).toBe("INCLUIDA");
    const agenda = await agendaPublicada(mediador, asambleaId);
    expect(agenda.map((p) => p.titulo)).toEqual(["Aprobar el presupuesto.", "Poner más luz en el pasaje"]);
    expect(agenda[1]).toMatchObject({ origen: "VECINAL", quien: "Carmen Huamán" });
  });

  it("@HU-ASA-14 la agenda del vecino muestra el tema pero no quién lo propuso", async () => {
    await decidirPropuesta(mediador, luz, { decision: "INCLUIR", motivo: "" }, ANTES_DE_LA_ASAMBLEA);
    const agenda = await agendaPublicada(julio, asambleaId);
    expect(agenda[1]).toEqual({ titulo: "Poner más luz en el pasaje", origen: "VECINAL" });
  });

  it("@HU-ASA-14 CA2 no incluir exige un motivo breve y no entra a la agenda", async () => {
    await expect(
      decidirPropuesta(mediador, basura, { decision: "NO_INCLUIR", motivo: " " }, ANTES_DE_LA_ASAMBLEA),
    ).rejects.toThrow();
    const { propuesta } = await decidirPropuesta(
      mediador,
      basura,
      { decision: "NO_INCLUIR", motivo: "Ya se trató en otra asamblea" },
      ANTES_DE_LA_ASAMBLEA,
    );
    expect(propuesta).toMatchObject({
      estado: "NO_INCLUIDA",
      motivoDecision: "Ya se trató en otra asamblea",
    });
    expect((await agendaPublicada(mediador, asambleaId)).map((p) => p.titulo)).toEqual([
      "Aprobar el presupuesto.",
    ]);
  });

  it("@HU-ASA-13 CA3 el vecino recibe el resultado: incluida o no, con el motivo", async () => {
    await decidirPropuesta(mediador, luz, { decision: "INCLUIR", motivo: "" }, ANTES_DE_LA_ASAMBLEA);
    await decidirPropuesta(
      mediador,
      basura,
      { decision: "NO_INCLUIR", motivo: "No le corresponde a la junta" },
      ANTES_DE_LA_ASAMBLEA,
    );
    const [aCarmen] = (await avisosDe(carmen.usuarioId)).filter((a) => a.titulo.includes("propuesta"));
    expect(aCarmen).toMatchObject({ titulo: "Su propuesta fue incluida en la agenda" });
    expect(aCarmen.texto).toContain("Poner más luz en el pasaje");
    const [aJulio] = (await avisosDe(julio.usuarioId)).filter((a) => a.titulo.includes("propuesta"));
    expect(aJulio.titulo).toBe("Su propuesta no se incluyó en la agenda");
    expect(aJulio.texto).toContain("Motivo: No le corresponde a la junta");
  });

  it("@HU-ASA-14 AC-5 repetir la misma decisión no avisa dos veces", async () => {
    await decidirPropuesta(mediador, luz, { decision: "INCLUIR", motivo: "" }, ANTES_DE_LA_ASAMBLEA);
    const otra = await decidirPropuesta(
      mediador,
      luz,
      { decision: "INCLUIR", motivo: "" },
      ANTES_DE_LA_ASAMBLEA,
    );
    expect(otra.registrada).toBe(false);
    expect((await avisosDe(carmen.usuarioId)).filter((a) => a.titulo.includes("propuesta"))).toHaveLength(1);
  });

  it("@HU-ASA-14 una decisión ya tomada no se pisa: primero se cambia la decisión", async () => {
    await decidirPropuesta(mediador, luz, { decision: "INCLUIR", motivo: "" }, ANTES_DE_LA_ASAMBLEA);
    await expect(
      decidirPropuesta(
        mediador,
        luz,
        { decision: "NO_INCLUIR", motivo: "Ya se trató" },
        ANTES_DE_LA_ASAMBLEA,
      ),
    ).rejects.toThrow(/Cambiar la decisión/);
    const { reabierta } = await cambiarDecision(mediador, luz, ANTES_DE_LA_ASAMBLEA);
    expect(reabierta).toBe(true);
    expect((await agendaPublicada(mediador, asambleaId)).map((p) => p.titulo)).toEqual([
      "Aprobar el presupuesto.",
    ]);
    await decidirPropuesta(
      mediador,
      luz,
      { decision: "NO_INCLUIR", motivo: "Ya se trató" },
      ANTES_DE_LA_ASAMBLEA,
    );
    expect((await bandejaDePropuestas(mediador, asambleaId)).find((p) => p.id === luz)?.estado).toBe(
      "NO_INCLUIDA",
    );
  });

  it("@HU-ASA-14 AC-6 audita quién decidió y el estado anterior", async () => {
    await decidirPropuesta(mediador, luz, { decision: "INCLUIR", motivo: "" }, ANTES_DE_LA_ASAMBLEA);
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "decidir_propuesta", entidadId: luz },
    });
    expect(auditoria.actorId).toBe(mediador.usuarioId);
    expect(auditoria.antes).toMatchObject({ estado: "PENDIENTE_REVISION" });
    expect(auditoria.despues).toMatchObject({ estado: "INCLUIDA" });
  });

  it("@HU-ASA-14 solo la directiva o el mediador deciden, y no después de que empiece la asamblea", async () => {
    await expect(
      decidirPropuesta(carmen, luz, { decision: "INCLUIR", motivo: "" }, ANTES_DE_LA_ASAMBLEA),
    ).rejects.toThrow();
    await expect(
      decidirPropuesta(mediador, luz, { decision: "INCLUIR", motivo: "" }, DESPUES_DE_EMPEZAR),
    ).rejects.toThrow(/ya empezó/);
    expect(
      (await bandejaDePropuestas(mediador, asambleaId)).every((p) => p.estado === "PENDIENTE_REVISION"),
    ).toBe(true);
  });
});
