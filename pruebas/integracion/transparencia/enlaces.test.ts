import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoEncontrado, ErrorReglaNegocio } from "@/compartido/errores";
import { publicarActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { registrarContingencia } from "@/modulos/asambleas/aplicacion/contingencia";
import { publicarConvocatoria } from "@/modulos/asambleas/aplicacion/convocatorias";
import { actividadesParaBalance, asambleasParaActa } from "@/modulos/asambleas/aplicacion/enlaces";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { publicarActa } from "@/modulos/transparencia/aplicacion/actas";
import { publicarBalance } from "@/modulos/transparencia/aplicacion/balances";

const PUBLICACION = new Date("2026-11-20T12:00:00Z");
// Las asambleas son el 14 de diciembre (6:00 p. m. de Lima) y la actividad el 12.
const DESPUES = new Date("2026-12-15T12:00:00Z");

let directiva: SesionDto;
let conQuorum: string;
let sinQuorum: string;
let informativa: string;
let actividadId: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const convocar = async (dia: string) =>
  (
    await publicarConvocatoria(
      directiva,
      {
        tipoAsamblea: "ORDINARIA",
        fechaHora: new Date(`${dia}T23:00:00Z`),
        lugar: "Local comunal",
        motivo: "Aprobar el presupuesto.",
        idOperacion: randomUUID(),
      },
      PUBLICACION,
    )
  ).asamblea.id;

const acta = (convocatoriaId: string | null, cambios = {}) => ({
  titulo: "Acta de la asamblea",
  fechaAsamblea: "2026-01-01",
  acuerdos: "Se aprobó el presupuesto.",
  compromisos: "",
  conclusiones: "",
  convocatoriaId,
  idOperacion: randomUUID(),
  ...cambios,
});

const balance = (convocatoriaId: string | null) => ({
  titulo: "Pollada pro-fondos",
  fechaActividad: "2026-01-01",
  ingresosVirtuales: 10000,
  ingresosEnPuerta: 5000,
  egresos: [],
  convocatoriaId,
  idOperacion: randomUUID(),
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones, asambleas_convocatorias, asambleas_asambleas, asambleas_eventos CASCADE`;
  await prisma.$executeRaw`TRUNCATE transparencia_publicaciones CASCADE`;
  await sembrar("clave-de-prueba");
  directiva = await sesionDe("40000002");
  conQuorum = await convocar("2026-12-14");
  sinQuorum = await convocar("2026-12-13");
  informativa = await convocar("2026-12-12");
  await prisma.asamblea.update({
    where: { convocatoriaId: conQuorum },
    data: { votacionesAbiertasEn: new Date("2026-12-14T23:30:00Z") },
  });
  await registrarContingencia(
    directiva,
    informativa,
    { decision: "INFORMATIVA", nuevaFechaHora: null },
    new Date("2026-12-12T03:00:00Z"),
  );
  actividadId = (
    await publicarActividad(
      directiva,
      {
        tipoActividad: "POLLADA",
        nombre: "Pollada pro-fondos para la reja",
        paraQue: "Reparar la reja principal",
        fechaHora: new Date("2026-12-12T17:00:00Z"),
        lugar: "Parque Central",
        precioUnidad: 1500,
        metaRecaudacion: null,
        pagos: "AMBOS",
        pideVoluntarios: false,
        idOperacion: randomUUID(),
      },
      PUBLICACION,
    )
  ).actividad.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-11 El acta se enlaza con su asamblea", () => {
  it("@HU-ASA-11 la directiva elige entre las asambleas que ya empezaron y ve cuáles admiten acuerdos", async () => {
    expect((await asambleasParaActa(new Date("2026-12-11T12:00:00Z"))).map((a) => a.id)).toEqual([]);
    const lista = await asambleasParaActa(DESPUES);
    expect(lista.map((a) => [a.id, a.dia, a.admiteAcuerdos])).toEqual([
      [conQuorum, "2026-12-14", true],
      [sinQuorum, "2026-12-13", false],
      [informativa, "2026-12-12", false],
    ]);
  });

  it("@HU-ASA-11 el acta de una asamblea con quórum queda enlazada y toma el día de la asamblea", async () => {
    const { acta: publicada } = await publicarActa(directiva, acta(conQuorum), DESPUES);
    expect(publicada.fechaAsamblea).toMatch(/14 de diciembre de 2026/);
    const fila = await prisma.actaDigital.findFirstOrThrow();
    expect(fila.convocatoriaId).toBe(conQuorum);
  });

  it("@HU-ASA-07 CA3 sin quórum definitivo no se aceptan acuerdos en el acta", async () => {
    await expect(publicarActa(directiva, acta(sinQuorum), DESPUES)).rejects.toThrow(
      /no tiene el quórum definitivo/,
    );
    await expect(publicarActa(directiva, acta(informativa), DESPUES)).rejects.toThrow(
      /sesión informativa: no admite acuerdos/,
    );
    expect(await prisma.actaDigital.count()).toBe(0);
  });

  it("@HU-ASA-11 una asamblea que no existe no se enlaza", async () => {
    await expect(publicarActa(directiva, acta(randomUUID()), DESPUES)).rejects.toBeInstanceOf(
      ErrorNoEncontrado,
    );
  });

  it("@HU-ASA-11 sin enlace, el acta de una asamblea anterior a la plataforma sigue publicándose", async () => {
    await publicarActa(directiva, acta(null, { fechaAsamblea: "2026-10-03" }), DESPUES);
    expect((await prisma.actaDigital.findFirstOrThrow()).convocatoriaId).toBeNull();
  });

  it("@HU-ASA-11 AC-5 repetir el envío no publica dos actas", async () => {
    const datos = acta(conQuorum);
    await publicarActa(directiva, datos, DESPUES);
    expect((await publicarActa(directiva, datos, DESPUES)).creado).toBe(false);
    expect(await prisma.actaDigital.count()).toBe(1);
  });
});

describe("@HU-ASA-10 El balance se enlaza con su actividad", () => {
  it("@HU-ASA-10 la directiva elige entre las actividades que ya se hicieron", async () => {
    expect(await actividadesParaBalance(new Date("2026-12-11T12:00:00Z"))).toEqual([]);
    expect(await actividadesParaBalance(DESPUES)).toEqual([
      expect.objectContaining({
        id: actividadId,
        nombre: "Pollada pro-fondos para la reja",
        dia: "2026-12-12",
      }),
    ]);
  });

  it("@HU-ASA-10 el balance queda enlazado y toma el día de la actividad", async () => {
    const { balance: publicado } = await publicarBalance(directiva, balance(actividadId), DESPUES);
    expect(publicado.fechaActividad).toMatch(/12 de diciembre de 2026/);
    expect((await prisma.balanceFinanciero.findFirstOrThrow()).convocatoriaId).toBe(actividadId);
  });

  it("@HU-ASA-10 una actividad que no existe no se enlaza; sin enlace sigue valiendo", async () => {
    await expect(publicarBalance(directiva, balance(randomUUID()), DESPUES)).rejects.toBeInstanceOf(
      ErrorNoEncontrado,
    );
    // Una asamblea no es una actividad pro fondos.
    await expect(publicarBalance(directiva, balance(conQuorum), DESPUES)).rejects.toBeInstanceOf(
      ErrorNoEncontrado,
    );
    await publicarBalance(directiva, balance(null), DESPUES);
    expect((await prisma.balanceFinanciero.findFirstOrThrow()).convocatoriaId).toBeNull();
  });
});

describe("regla de negocio", () => {
  it("el error de quórum es de regla de negocio (422), no de validación", async () => {
    await expect(publicarActa(directiva, acta(sinQuorum), DESPUES)).rejects.toBeInstanceOf(ErrorReglaNegocio);
  });
});
