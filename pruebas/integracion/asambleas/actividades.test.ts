import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  colaborar,
  miColaboracion,
  proximaActividad,
  publicarActividad,
  registrarComprobante,
  verActividades,
} from "@/modulos/asambleas/aplicacion/actividades";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const AHORA = new Date("2026-10-01T12:00:00Z");
const DESPUES = new Date("2026-10-26T12:00:00Z");

let directiva: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let actividadId: string;

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
  metaRecaudacion: 120000,
  pagos: "AMBOS" as "AMBOS" | "ANTICIPADO" | "PUERTA",
  pideVoluntarios: false,
};

const publicar = (sesion: SesionDto, cambios: Partial<typeof DATOS> = {}) =>
  publicarActividad(sesion, { ...DATOS, ...cambios, idOperacion: randomUUID() }, AHORA);

const aportar = (sesion: SesionDto, cantidad: number, modalidad: "ANTICIPADA" | "EN_PUERTA", ahora = AHORA) =>
  colaborar(sesion, actividadId, { cantidad, modalidad, idOperacion: randomUUID() }, ahora);

const archivoPropio = (sesion: SesionDto, uso = "comprobante_aporte") =>
  prisma.archivo.create({
    data: {
      clave: `pruebas/${randomUUID()}.jpg`,
      tipo: "image/jpeg",
      tamano: 1000,
      uso,
      subidoPor: sesion.usuarioId,
    },
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, asambleas_convocatorias, asambleas_eventos, asambleas_colaboraciones CASCADE`;
  await sembrar("clave-de-prueba");
  directiva = await sesionDe("40000002");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  actividadId = (await publicar(directiva)).actividad.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-08 Modalidad de aporte en eventos pro fondos", () => {
  it("@HU-ASA-08 la directiva publica la actividad con precio en céntimos y avisa a cada casa", async () => {
    const [actividad] = await verActividades(carmen);
    expect(actividad).toMatchObject({
      nombre: "Pollada pro-fondos para la reja",
      precioUnidad: 1500,
      precioTexto: "S/ 15.00",
      metaTexto: "S/ 1,200.00",
      pagosTexto: "Por Yape o Plin y en la puerta",
      modalidades: ["ANTICIPADA", "EN_PUERTA"],
    });
    const avisos = await prisma.avisoEnCola.findMany({
      where: { titulo: { startsWith: "Nueva actividad" } },
    });
    expect(avisos).toHaveLength(await prisma.residencia.count({ where: { fechaFin: null } }));
    expect(avisos[0].texto).toContain("S/ 15.00 por plato");
  });

  it("@HU-ASA-08 AC-5 AC-6 publicar dos veces lo mismo no avisa dos veces y queda auditado", async () => {
    const idOperacion = randomUUID();
    await publicarActividad(directiva, { ...DATOS, nombre: "Bingo", idOperacion }, AHORA);
    const otra = await publicarActividad(directiva, { ...DATOS, nombre: "Bingo", idOperacion }, AHORA);
    expect(otra.creada).toBe(false);
    expect(await prisma.convocatoria.count({ where: { titulo: "Bingo" } })).toBe(1);
    const auditoria = await prisma.registroAuditoria.findFirst({
      where: { accion: "publicar_actividad", entidadId: actividadId },
    });
    expect(auditoria?.actorId).toBe(directiva.usuarioId);
  });

  it("@HU-ASA-08 solo la directiva publica y los datos incompletos se rechazan con mensajes llanos", async () => {
    await expect(publicar(carmen)).rejects.toThrow();
    await expect(publicar(directiva, { nombre: " " })).rejects.toThrow();
    await expect(publicar(directiva, { precioUnidad: null as never })).rejects.toThrow();
  });

  it("@HU-ASA-08 CA1 CA3 pagar en la puerta agenda el cobro del día, con el total en céntimos", async () => {
    const { colaboracion, creada } = await aportar(carmen, 3, "EN_PUERTA");
    expect(creada).toBe(true);
    expect(colaboracion).toMatchObject({
      cantidad: 3,
      monto: 4500,
      montoTexto: "S/ 45.00",
      estado: "AGENDADA",
    });
    expect(await miColaboracion(carmen, actividadId)).toMatchObject({
      estado: "AGENDADA",
      tieneComprobante: false,
    });
  });

  it("@HU-ASA-08 CA1 CA2 pagar antes queda por revisar a la espera del comprobante", async () => {
    const { colaboracion } = await aportar(carmen, 2, "ANTICIPADA");
    expect(colaboracion).toMatchObject({ monto: 3000, estado: "POR_REVISAR", tieneComprobante: false });
  });

  it("@HU-ASA-08 CA2 adjunta el comprobante que el propio vecino subió", async () => {
    await aportar(carmen, 2, "ANTICIPADA");
    const archivo = await archivoPropio(carmen);
    const actual = await registrarComprobante(carmen, actividadId, archivo.id);
    expect(actual).toMatchObject({ estado: "POR_REVISAR", tieneComprobante: true });
  });

  it("@HU-ASA-08 AC-7 no acepta el archivo de otra persona ni de otro uso, ni un aporte en la puerta", async () => {
    await aportar(carmen, 2, "ANTICIPADA");
    await expect(
      registrarComprobante(carmen, actividadId, (await archivoPropio(julio)).id),
    ).rejects.toMatchObject({
      campos: { archivoId: expect.stringMatching(/Suba de nuevo/) },
    });
    await expect(
      registrarComprobante(carmen, actividadId, (await archivoPropio(carmen, "evidencia_queja")).id),
    ).rejects.toMatchObject({ campos: { archivoId: expect.stringMatching(/Suba de nuevo/) } });
    await aportar(julio, 1, "EN_PUERTA");
    await expect(registrarComprobante(julio, actividadId, (await archivoPropio(julio)).id)).rejects.toThrow(
      /no necesita comprobante/,
    );
  });

  it("@HU-ASA-08 AC-7 quien no colaboró recibe 404 al querer adjuntar un comprobante", async () => {
    await expect(
      registrarComprobante(julio, actividadId, (await archivoPropio(julio)).id),
    ).rejects.toMatchObject({ estadoHttp: 404 });
  });

  it("@HU-ASA-08 solo se permiten las formas de pago que eligió la directiva", async () => {
    const soloPuerta = (await publicar(directiva, { pagos: "PUERTA", nombre: "Rifa" })).actividad.id;
    await expect(
      colaborar(
        carmen,
        soloPuerta,
        { cantidad: 1, modalidad: "ANTICIPADA", idOperacion: randomUUID() },
        AHORA,
      ),
    ).rejects.toMatchObject({ campos: { modalidad: expect.stringMatching(/no está disponible/) } });
  });

  it("@HU-ASA-08 CA1 la cantidad va de 1 a 10", async () => {
    await expect(aportar(carmen, 0, "EN_PUERTA")).rejects.toThrow();
    await expect(aportar(carmen, 11, "EN_PUERTA")).rejects.toThrow();
    expect(await prisma.colaboracion.count()).toBe(0);
  });

  it("@HU-ASA-08 AC-5 una casa aporta una vez; reintentar con el mismo idOperacion devuelve el aporte", async () => {
    const idOperacion = randomUUID();
    const datos = { cantidad: 2, modalidad: "EN_PUERTA" as const, idOperacion };
    const primera = await colaborar(carmen, actividadId, datos, AHORA);
    const segunda = await colaborar(carmen, actividadId, datos, AHORA);
    expect(segunda.creada).toBe(false);
    expect(segunda.colaboracion.id).toBe(primera.colaboracion.id);
    await expect(aportar(carmen, 5, "EN_PUERTA")).rejects.toThrow(/ya registró su aporte/);
    expect(await prisma.colaboracion.count()).toBe(1);
  });

  it("@HU-ASA-08 AC-7 otra persona no puede reusar el identificador del aporte de una casa ajena", async () => {
    const idOperacion = randomUUID();
    await colaborar(carmen, actividadId, { cantidad: 1, modalidad: "EN_PUERTA", idOperacion }, AHORA);
    await expect(
      colaborar(julio, actividadId, { cantidad: 1, modalidad: "EN_PUERTA", idOperacion }, AHORA),
    ).rejects.toMatchObject({ estadoHttp: 404 });
  });

  it("@HU-ASA-08 AC-6 audita el aporte con quién, cuánto y cómo", async () => {
    await aportar(carmen, 2, "ANTICIPADA");
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "colaborar_con_actividad", entidadId: actividadId },
    });
    expect(auditoria.actorId).toBe(carmen.usuarioId);
    expect(auditoria.despues).toMatchObject({ cantidad: 2, modalidad: "ANTICIPADA", monto: 3000 });
  });

  it("@HU-ASA-08 pasada la fecha ya no se reciben aportes", async () => {
    await expect(aportar(carmen, 1, "EN_PUERTA", DESPUES)).rejects.toThrow(/ya se realizó/);
  });

  it("@HU-ASA-08 la próxima actividad es la publicada, y sigue en curso el día de la actividad", async () => {
    expect((await proximaActividad(carmen, AHORA))?.id).toBe(actividadId);
    expect((await proximaActividad(carmen, new Date("2026-10-25T20:00:00Z")))?.id).toBe(actividadId);
    expect(await proximaActividad(carmen, DESPUES)).toBeNull();
  });
});
