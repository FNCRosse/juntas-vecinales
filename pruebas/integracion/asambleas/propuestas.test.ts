import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { publicarConvocatoria } from "@/modulos/asambleas/aplicacion/convocatorias";
import { bandejaDePropuestas, misPropuestas, proponerTema } from "@/modulos/asambleas/aplicacion/propuestas";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const PUBLICACION = new Date("2026-11-20T12:00:00Z");
// La asamblea es el 14 de diciembre (Lima); la agenda cierra 9 días antes: el 5 de diciembre, a fin del día.
const ANTES_DEL_CIERRE = new Date("2026-12-05T20:00:00Z");
const DESPUES_DEL_CIERRE = new Date("2026-12-06T12:00:00Z");

let directiva: SesionDto;
let mediador: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let asambleaId: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const PROPUESTA = { titulo: "Cámaras en la entrada", justificacion: "Hubo dos robos este mes." };
const proponer = (sesion: SesionDto, ahora = ANTES_DEL_CIERRE, datos = PROPUESTA) =>
  proponerTema(sesion, asambleaId, { ...datos, idOperacion: randomUUID() }, ahora);

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
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-13 Proponer un tema para la agenda", () => {
  it("@HU-ASA-13 CA1 CA2 el vecino registra título y justificación y queda pendiente de revisión", async () => {
    const { propuesta, creada } = await proponer(carmen);
    expect(creada).toBe(true);
    expect(propuesta).toMatchObject({ ...PROPUESTA, estado: "PENDIENTE_REVISION", motivoDecision: null });
  });

  it("@HU-ASA-13 CA1 la agenda se cierra 9 días antes: el último día todavía se puede, después no", async () => {
    await expect(proponer(carmen, ANTES_DEL_CIERRE)).resolves.toMatchObject({ creada: true });
    await expect(proponer(julio, DESPUES_DEL_CIERRE)).rejects.toThrow(/cerró la agenda/);
    expect(await prisma.propuestaAgenda.count()).toBe(1);
  });

  it("@HU-ASA-13 CA2 la directiva ve las propuestas en su bandeja, por fecha de envío, con quién las envió", async () => {
    await proponer(carmen);
    await proponer(julio, ANTES_DEL_CIERRE, {
      titulo: "Horario del vigilante",
      justificacion: "Hay poca luz.",
    });
    const bandeja = await bandejaDePropuestas(mediador, asambleaId);
    expect(bandeja.map((p) => p.titulo)).toEqual(["Cámaras en la entrada", "Horario del vigilante"]);
    expect(bandeja[0]).toMatchObject({
      quien: "Carmen Huamán",
      vivienda: "Mz. C, lote 7",
      estado: "PENDIENTE_REVISION",
    });
  });

  it("@HU-ASA-13 AC-7 el vecino solo ve sus propias propuestas y no la bandeja", async () => {
    await proponer(carmen);
    await proponer(julio, ANTES_DEL_CIERRE, {
      titulo: "Horario del vigilante",
      justificacion: "Hay poca luz.",
    });
    expect((await misPropuestas(carmen, asambleaId)).map((p) => p.titulo)).toEqual(["Cámaras en la entrada"]);
    await expect(bandejaDePropuestas(carmen, asambleaId)).rejects.toThrow();
  });

  it("@HU-ASA-13 AC-5 reintentar con el mismo idOperacion no registra otra propuesta", async () => {
    const idOperacion = randomUUID();
    const primera = await proponerTema(carmen, asambleaId, { ...PROPUESTA, idOperacion }, ANTES_DEL_CIERRE);
    const segunda = await proponerTema(carmen, asambleaId, { ...PROPUESTA, idOperacion }, ANTES_DEL_CIERRE);
    expect(segunda.creada).toBe(false);
    expect(segunda.propuesta.id).toBe(primera.propuesta.id);
    expect(await prisma.propuestaAgenda.count()).toBe(1);
  });

  it("@HU-ASA-13 AC-7 otra persona no puede reusar el identificador de una propuesta ajena", async () => {
    const idOperacion = randomUUID();
    await proponerTema(carmen, asambleaId, { ...PROPUESTA, idOperacion }, ANTES_DEL_CIERRE);
    await expect(
      proponerTema(julio, asambleaId, { ...PROPUESTA, idOperacion }, ANTES_DEL_CIERRE),
    ).rejects.toMatchObject({ estadoHttp: 404 });
  });

  it("@HU-ASA-13 AC-6 audita quién propuso", async () => {
    await proponer(carmen);
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "proponer_tema", entidadId: asambleaId },
    });
    expect(auditoria.actorId).toBe(carmen.usuarioId);
  });

  it("@HU-ASA-13 CA1 pide el título y la justificación con mensajes en lenguaje llano", async () => {
    await expect(proponer(carmen, ANTES_DEL_CIERRE, { titulo: " ", justificacion: "x" })).rejects.toThrow();
    await expect(proponer(carmen, ANTES_DEL_CIERRE, { titulo: "x", justificacion: "" })).rejects.toThrow();
    expect(await prisma.propuestaAgenda.count()).toBe(0);
  });

  it("@HU-ASA-13 una sesión informativa no recibe propuestas para la agenda", async () => {
    await prisma.convocatoria.update({ where: { id: asambleaId }, data: { estado: "INFORMATIVA" } });
    await expect(proponer(carmen)).rejects.toThrow(/no recibe propuestas/);
  });
});
