import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { colaborar, publicarActividad } from "@/modulos/asambleas/aplicacion/actividades";
import {
  evaluarVoluntariado,
  miVoluntariado,
  ofrecerAyuda,
  voluntariosDeLaActividad,
} from "@/modulos/asambleas/aplicacion/voluntarios";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const AHORA = new Date("2026-10-01T12:00:00Z");
const DESPUES = new Date("2026-10-26T12:00:00Z");

let directiva: SesionDto;
let mediador: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let actividadId: string;
let sinVoluntarios: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const DATOS = {
  tipoActividad: "POLLADA" as const,
  nombre: "Pollada pro-fondos para la reja",
  paraQue: "Reparar la reja principal",
  fechaHora: new Date("2026-10-25T17:00:00Z"),
  lugar: "Parque Central",
  precioUnidad: 1500,
  metaRecaudacion: null,
  pagos: "AMBOS" as const,
};

const publicar = async (pideVoluntarios: boolean, nombre = DATOS.nombre) =>
  (
    await publicarActividad(
      directiva,
      { ...DATOS, nombre, pideVoluntarios, idOperacion: randomUUID() },
      AHORA,
    )
  ).actividad.id;

const ofrecer = (sesion: SesionDto, descripcion = "Puedo atender la mesa de la entrada.", id = actividadId) =>
  ofrecerAyuda(sesion, id, { descripcion, idOperacion: randomUUID() }, AHORA);

const avisosDe = (usuarioId: string) =>
  prisma.avisoEnCola.findMany({ where: { destinatarioId: usuarioId, titulo: { contains: "ayuda" } } });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, asambleas_convocatorias, asambleas_eventos, asambleas_colaboraciones, asambleas_voluntarios CASCADE`;
  await sembrar("clave-de-prueba");
  directiva = await sesionDe("40000002");
  mediador = await sesionDe("40000003");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  actividadId = await publicar(true);
  sinVoluntarios = await publicar(false, "Bingo sin voluntarios");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-09 Voluntariado", () => {
  it("@HU-ASA-09 CA1 la casa describe cómo ayudaría y queda pendiente", async () => {
    const { voluntariado, creado } = await ofrecer(carmen);
    expect(creado).toBe(true);
    expect(voluntariado).toMatchObject({
      descripcion: "Puedo atender la mesa de la entrada.",
      estado: "PENDIENTE",
      rolAsignado: null,
      eximeDeCuota: false,
    });
    expect(await miVoluntariado(carmen, actividadId)).toMatchObject({ estado: "PENDIENTE" });
  });

  it("@HU-ASA-09 CA1 solo si la actividad pide voluntarios, y con una descripción", async () => {
    await expect(ofrecer(carmen, "Ayudo en la cocina.", sinVoluntarios)).rejects.toThrow(
      /no pide voluntarios/,
    );
    await expect(ofrecer(carmen, " ")).rejects.toMatchObject({
      campos: { descripcion: expect.stringMatching(/ayudar/) },
    });
    expect(await prisma.voluntariado.count()).toBe(0);
  });

  it("@HU-ASA-09 CA2 la directiva ve los ofrecimientos con quién y dónde vive", async () => {
    await ofrecer(carmen);
    const [v] = await voluntariosDeLaActividad(mediador, actividadId);
    expect(v).toMatchObject({ quien: "Carmen Huamán", vivienda: "Mz. C, lote 7", estado: "PENDIENTE" });
    await expect(voluntariosDeLaActividad(carmen, actividadId)).rejects.toThrow();
  });

  it("@HU-ASA-09 CA2 CA3 aprobar registra el rol, avisa al vecino y lo exime de la cuota", async () => {
    const { voluntariado } = await ofrecer(carmen);
    const { voluntariado: aprobado } = await evaluarVoluntariado(
      mediador,
      voluntariado.id,
      { decision: "APROBAR", rol: " Mesa de la entrada " },
      AHORA,
    );
    expect(aprobado).toMatchObject({
      estado: "APROBADO",
      rolAsignado: "Mesa de la entrada",
      eximeDeCuota: true,
    });
    const [aviso] = await avisosDe(carmen.usuarioId);
    expect(aviso.titulo).toBe("Su ayuda fue aprobada");
    expect(aviso.texto).toContain("Mesa de la entrada");
    expect(aviso.texto).toContain("No paga la colaboración");
  });

  it("@HU-ASA-09 CA3 el voluntario aprobado no puede además pagar la colaboración", async () => {
    const { voluntariado } = await ofrecer(carmen);
    await evaluarVoluntariado(mediador, voluntariado.id, { decision: "APROBAR", rol: "Cocina" }, AHORA);
    await expect(
      colaborar(
        carmen,
        actividadId,
        { cantidad: 1, modalidad: "EN_PUERTA", idOperacion: randomUUID() },
        AHORA,
      ),
    ).rejects.toThrow(/no paga la colaboración/);
    expect(await prisma.colaboracion.count()).toBe(0);
  });

  it("@HU-ASA-09 mientras está pendiente tampoco paga, pero si no se aprueba por ahora sí puede", async () => {
    const { voluntariado } = await ofrecer(carmen);
    await expect(
      colaborar(
        carmen,
        actividadId,
        { cantidad: 1, modalidad: "EN_PUERTA", idOperacion: randomUUID() },
        AHORA,
      ),
    ).rejects.toThrow(/pendiente/);
    await evaluarVoluntariado(mediador, voluntariado.id, { decision: "NO_APROBAR", rol: "" }, AHORA);
    const [aviso] = await avisosDe(carmen.usuarioId);
    expect(aviso.titulo).toBe("Su ayuda no se aprobó por ahora");
    const { colaboracion } = await colaborar(
      carmen,
      actividadId,
      { cantidad: 2, modalidad: "EN_PUERTA", idOperacion: randomUUID() },
      AHORA,
    );
    expect(colaboracion.monto).toBe(3000);
  });

  it("@HU-ASA-09 quien ya colaboró no se ofrece como voluntario", async () => {
    await colaborar(
      julio,
      actividadId,
      { cantidad: 1, modalidad: "EN_PUERTA", idOperacion: randomUUID() },
      AHORA,
    );
    await expect(ofrecer(julio)).rejects.toThrow(/ya registró su aporte/);
  });

  it("@HU-ASA-09 CA2 aprobar exige el rol asignado", async () => {
    const { voluntariado } = await ofrecer(carmen);
    await expect(
      evaluarVoluntariado(mediador, voluntariado.id, { decision: "APROBAR", rol: " " }, AHORA),
    ).rejects.toMatchObject({ campos: { rol: expect.stringMatching(/rol/i) } });
    expect((await miVoluntariado(carmen, actividadId))?.estado).toBe("PENDIENTE");
  });

  it("@HU-ASA-09 AC-5 repetir el ofrecimiento o la decisión no duplica ni avisa dos veces", async () => {
    const idOperacion = randomUUID();
    const datos = { descripcion: "Ayudo en la cocina.", idOperacion };
    const primero = await ofrecerAyuda(carmen, actividadId, datos, AHORA);
    const segundo = await ofrecerAyuda(carmen, actividadId, datos, AHORA);
    expect(segundo.creado).toBe(false);
    expect(segundo.voluntariado.id).toBe(primero.voluntariado.id);
    await expect(ofrecer(carmen)).rejects.toThrow(/ya ofreció su ayuda/);

    const decision = { decision: "APROBAR" as const, rol: "Cocina" };
    await evaluarVoluntariado(mediador, primero.voluntariado.id, decision, AHORA);
    const otra = await evaluarVoluntariado(mediador, primero.voluntariado.id, decision, AHORA);
    expect(otra.registrada).toBe(false);
    expect(await avisosDe(carmen.usuarioId)).toHaveLength(1);
  });

  it("@HU-ASA-09 AC-7 otra persona no puede reusar el identificador de un ofrecimiento ajeno", async () => {
    const idOperacion = randomUUID();
    await ofrecerAyuda(carmen, actividadId, { descripcion: "Ayudo.", idOperacion }, AHORA);
    await expect(
      ofrecerAyuda(julio, actividadId, { descripcion: "Ayudo.", idOperacion }, AHORA),
    ).rejects.toMatchObject({ estadoHttp: 404 });
  });

  it("@HU-ASA-09 AC-6 audita el ofrecimiento y la decisión con quién la tomó", async () => {
    const { voluntariado } = await ofrecer(carmen);
    await evaluarVoluntariado(mediador, voluntariado.id, { decision: "APROBAR", rol: "Cocina" }, AHORA);
    const decision = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "evaluar_voluntariado", entidadId: voluntariado.id },
    });
    expect(decision.actorId).toBe(mediador.usuarioId);
    expect(decision.antes).toMatchObject({ estado: "PENDIENTE" });
    expect(decision.despues).toMatchObject({ estado: "APROBADO", rol: "Cocina" });
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "ofrecer_ayuda", entidadId: actividadId } }),
    ).toBe(1);
  });

  it("@HU-ASA-09 solo la directiva decide y después de la actividad ya no se ofrece ayuda", async () => {
    const { voluntariado } = await ofrecer(carmen);
    await expect(
      evaluarVoluntariado(julio, voluntariado.id, { decision: "APROBAR", rol: "Cocina" }, AHORA),
    ).rejects.toThrow();
    await expect(
      ofrecerAyuda(julio, actividadId, { descripcion: "Ayudo.", idOperacion: randomUUID() }, DESPUES),
    ).rejects.toThrow(/ya se realizó/);
  });
});
