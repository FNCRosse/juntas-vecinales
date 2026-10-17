import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  abrirLasVotaciones,
  buscarParaPaseDeLista,
  marcarCasaPresente,
  paseDeLista,
  validarPoderDeVoto,
} from "@/modulos/asambleas/aplicacion/checkin";
import { proximaAsamblea, publicarConvocatoria } from "@/modulos/asambleas/aplicacion/convocatorias";
import { delegarVoto } from "@/modulos/asambleas/aplicacion/delegaciones";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const PUBLICACION = new Date("2026-12-01T12:00:00Z");
// La asamblea es el 14 de diciembre a las 6:00 p. m. de Lima (23:00 UTC).
const ANTES_DEL_DIA = new Date("2026-12-13T12:00:00Z");
const EL_DIA = new Date("2026-12-14T23:30:00Z");

let mediador: SesionDto;
let directiva: SesionDto;
let carmen: SesionDto;
let julio: SesionDto;
let vecino: SesionDto;
let asambleaId: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};
const predioDe = async (dni: string) =>
  (await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } })).predioId;

/** Con un padrón de N casas el mínimo es la mitad más una; se fija para llegar sin sembrar cien vecinos. */
const fijarPadron = (padronTotal: number, quorumRequerido: number) =>
  prisma.asamblea.update({ where: { convocatoriaId: asambleaId }, data: { padronTotal, quorumRequerido } });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, asambleas_convocatorias, asambleas_asambleas, asambleas_confirmaciones, asambleas_delegaciones, asambleas_checkins CASCADE`;
  await sembrar("clave-de-prueba");
  mediador = await sesionDe("40000003");
  directiva = await sesionDe("40000002");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  vecino = await sesionDe("40000007");
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

describe("@HU-ASA-07 Check-in presencial y quórum definitivo", () => {
  it("@HU-ASA-07 CA1 el mediador busca a un vecino y marca a su casa como presente", async () => {
    const [encontrado] = await buscarParaPaseDeLista(mediador, asambleaId, "08123478");
    expect(encontrado).toMatchObject({ dniTerminadoEn: "78", presente: false });
    const lista = await marcarCasaPresente(mediador, asambleaId, encontrado.predioId, EL_DIA);
    expect(lista.llegaron.map((l) => l.predioId)).toEqual([encontrado.predioId]);
    expect((await buscarParaPaseDeLista(mediador, asambleaId, "08123478"))[0].presente).toBe(true);
  });

  it("@HU-ASA-07 AC-5 marcar dos veces a la misma casa cuenta una vez y audita una vez", async () => {
    const predio = await predioDe("08123478");
    await marcarCasaPresente(mediador, asambleaId, predio, EL_DIA);
    await marcarCasaPresente(mediador, asambleaId, predio, EL_DIA);
    expect(await prisma.checkInPresencial.count()).toBe(1);
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "marcar_presente", entidadId: asambleaId } }),
    ).toBe(1);
  });

  it("@HU-ASA-07 CA2 el quórum definitivo cuenta solo presentes y poderes validados, no las confirmaciones", async () => {
    await prisma.confirmacionAsistencia.create({
      data: { convocatoriaId: asambleaId, predioId: await predioDe("40000007"), modo: "DIGITAL" },
    });
    expect((await paseDeLista(mediador, asambleaId)).quorum.total).toBe(0);
    await marcarCasaPresente(mediador, asambleaId, await predioDe("08123478"), EL_DIA);
    expect((await paseDeLista(mediador, asambleaId)).quorum).toMatchObject({
      presentes: 1,
      poderes: 0,
      total: 1,
    });
  });

  it("@HU-ASA-07 CA1 CA2 un poder solo cuenta cuando se valida en la puerta", async () => {
    const { delegacion } = await delegarVoto(
      julio,
      asambleaId,
      { nombre: "Rosa Huamán", dni: "08123456", condicion: "FAMILIAR" },
      PUBLICACION,
    );
    const antes = await paseDeLista(mediador, asambleaId);
    expect(antes.poderes).toMatchObject([
      { numero: delegacion.numero, apoderado: "Rosa Huamán", validado: false },
    ]);
    expect(antes.quorum.total).toBe(0);

    const despues = await validarPoderDeVoto(mediador, asambleaId, delegacion.id, EL_DIA);
    expect(despues.poderes[0].validado).toBe(true);
    expect(despues.quorum).toMatchObject({ presentes: 0, poderes: 1, total: 1 });
  });

  it("@HU-ASA-07 un voto por casa: titular presente y poder validado cuentan una vez", async () => {
    const { delegacion } = await delegarVoto(
      julio,
      asambleaId,
      { nombre: "Rosa Huamán", dni: "08123456", condicion: "FAMILIAR" },
      PUBLICACION,
    );
    await marcarCasaPresente(mediador, asambleaId, await predioDe("40000006"), EL_DIA);
    const lista = await validarPoderDeVoto(mediador, asambleaId, delegacion.id, EL_DIA);
    expect(lista.quorum).toMatchObject({ presentes: 1, poderes: 1, total: 1 });
  });

  it("@HU-ASA-07 CA3 sin quórum definitivo se bloquean las votaciones y el mensaje dice cuánto falta", async () => {
    await fijarPadron(120, 61);
    await marcarCasaPresente(mediador, asambleaId, await predioDe("08123478"), EL_DIA);
    await expect(abrirLasVotaciones(mediador, asambleaId, EL_DIA)).rejects.toThrow(
      /faltan 60 casas para el quórum de 61/,
    );
    expect((await paseDeLista(mediador, asambleaId)).votaciones).toBe("CERRADAS");
    expect((await proximaAsamblea(mediador, EL_DIA))?.votacion).toBe("CERRADA");
  });

  it("@HU-ASA-07 CA3 con quórum definitivo se abren las votaciones, una sola vez y auditadas", async () => {
    await fijarPadron(2, 2);
    await marcarCasaPresente(mediador, asambleaId, await predioDe("08123478"), EL_DIA);
    await marcarCasaPresente(mediador, asambleaId, await predioDe("40000006"), EL_DIA);
    expect((await abrirLasVotaciones(mediador, asambleaId, EL_DIA)).votaciones).toBe("ABIERTAS");
    await abrirLasVotaciones(mediador, asambleaId, EL_DIA);
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "abrir_votaciones", entidadId: asambleaId } }),
    ).toBe(1);
    expect((await proximaAsamblea(vecino, EL_DIA))?.votacion).toBe("ABIERTA");
  });

  it("@HU-ASA-07 una sesión informativa nunca abre votaciones, aunque haya gente", async () => {
    await fijarPadron(1, 1);
    await prisma.convocatoria.update({ where: { id: asambleaId }, data: { estado: "INFORMATIVA" } });
    await marcarCasaPresente(mediador, asambleaId, await predioDe("08123478"), EL_DIA);
    await expect(abrirLasVotaciones(mediador, asambleaId, EL_DIA)).rejects.toThrow(/sesión informativa/);
    expect((await paseDeLista(mediador, asambleaId)).votaciones).toBe("SIN_VOTACION");
  });

  it("@HU-ASA-07 el pase de lista solo se abre el día de la asamblea", async () => {
    const predio = await predioDe("08123478");
    await expect(marcarCasaPresente(mediador, asambleaId, predio, ANTES_DEL_DIA)).rejects.toThrow(
      /día de la asamblea/,
    );
    await expect(abrirLasVotaciones(mediador, asambleaId, ANTES_DEL_DIA)).rejects.toThrow(
      /día de la asamblea/,
    );
    expect(await prisma.checkInPresencial.count()).toBe(0);
  });

  it("@HU-ASA-07 AC-6 audita quién marcó y quién validó", async () => {
    const { delegacion } = await delegarVoto(
      julio,
      asambleaId,
      { nombre: "Rosa Huamán", dni: "08123456", condicion: "FAMILIAR" },
      PUBLICACION,
    );
    await marcarCasaPresente(mediador, asambleaId, await predioDe("08123478"), EL_DIA);
    await validarPoderDeVoto(mediador, asambleaId, delegacion.id, EL_DIA);
    const acciones = await prisma.registroAuditoria.findMany({
      where: { entidadId: asambleaId, accion: { in: ["marcar_presente", "validar_poder"] } },
    });
    expect(acciones.map((a) => a.accion).sort()).toEqual(["marcar_presente", "validar_poder"]);
    expect(acciones.every((a) => a.actorId === mediador.usuarioId)).toBe(true);
  });

  it("@HU-ASA-07 solo la directiva o el mediador hacen el pase de lista", async () => {
    await expect(paseDeLista(vecino, asambleaId)).rejects.toThrow();
    await expect(
      marcarCasaPresente(vecino, asambleaId, await predioDe("08123478"), EL_DIA),
    ).rejects.toThrow();
    await expect(abrirLasVotaciones(carmen, asambleaId, EL_DIA)).rejects.toThrow();
    expect(await prisma.checkInPresencial.count()).toBe(0);
  });
});
