import { fijarReloj } from "@/pruebas/relojFijo";
import { randomUUID } from "node:crypto";
import { GET as pdfHttp } from "@/app/api/transparencia/actas/[id]/pdf/route";
import { POST as previaHttp } from "@/app/api/transparencia/actas/vista-previa/route";
import { POST as publicarHttp } from "@/app/api/transparencia/actas/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { despacharAvisos } from "@/compartido/notificaciones/despachar";
import { crearSimulador } from "@/compartido/notificaciones/whatsapp";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  actasPublicadas,
  descargarActa,
  publicarActa,
  vistaPreviaActa,
} from "@/modulos/transparencia/aplicacion/actas";

const T0 = new Date("2026-10-05T15:00:00Z");
let marta: SesionDto;
let tokenMarta: string;
let carmen: SesionDto;

const datos = (cambios: Partial<Parameters<typeof publicarActa>[1]> = {}) => ({
  titulo: "Asamblea general de octubre",
  fechaAsamblea: "2026-10-03",
  acuerdos: "Se aprobó la cuota de vigilancia.\nSe aprobó el cierre del parque.",
  compromisos: "La directiva presenta el balance en 15 días.",
  conclusiones: "Asistieron 84 familias.",
  idOperacion: randomUUID(),
  ...cambios,
});

const textoDelPdf = (bytes: Buffer) => bytes.toString("latin1");

async function sesionDeVecino(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

beforeEach(async () => {
  fijarReloj(T0);
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones CASCADE`;
  await prisma.$executeRaw`TRUNCATE transparencia_publicaciones CASCADE`;
  await sembrar("clave-de-prueba");
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({
    dni: "40000002",
    clave: "clave-de-prueba",
  }));
  carmen = await sesionDeVecino("08123478");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-11 Acta digital en PDF y su publicación", () => {
  it("@HU-ASA-11 CA1 la directiva redacta acuerdos, compromisos y conclusiones y el acta queda guardada", async () => {
    const { acta, creado } = await publicarActa(marta, datos(), T0);
    expect(creado).toBe(true);
    expect(acta).toMatchObject({
      titulo: "Asamblea general de octubre",
      fechaAsamblea: "Sábado 3 de octubre de 2026",
      acuerdos: ["Se aprobó la cuota de vigilancia.", "Se aprobó el cierre del parque."],
      compromisos: ["La directiva presenta el balance en 15 días."],
      conclusiones: "Asistieron 84 familias.",
      autor: "Marta Rojas",
    });
    expect(await prisma.publicacion.findUniqueOrThrow({ where: { id: acta.id } })).toMatchObject({
      tipo: "ACTA",
    });
  });

  it("@HU-ASA-11 CA1 solo la directiva publica y pide los datos que faltan", async () => {
    await expect(publicarActa(carmen, datos(), T0)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    const error = await publicarActa(marta, datos({ titulo: "", acuerdos: "" }), T0).catch((e) => e);
    expect(error).toBeInstanceOf(ErrorValidacion);
    expect(error.campos).toEqual({
      titulo: "Escriba el título del acta.",
      acuerdos: "Escriba al menos un acuerdo de la asamblea.",
    });
    expect(await prisma.publicacion.count()).toBe(0);
  });

  it("@HU-ASA-11 CA2 el PDF es descargable, etiquetado, en español y lleva el contenido del acta", async () => {
    const { acta } = await publicarActa(marta, datos(), T0);
    const { pdf, nombreArchivo } = await descargarActa(carmen, acta.id);
    expect(nombreArchivo).toBe("acta-asamblea-general-de-octubre.pdf");
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(textoDelPdf(pdf)).toMatch(/\/Lang \(es-PE\)/);
    expect(textoDelPdf(pdf)).toMatch(/\/StructTreeRoot/);
    expect(textoDelPdf(pdf).length).toBeGreaterThan(1500);
  });

  it("@HU-ASA-11 CA2 se puede ver cómo queda el PDF antes de publicar, sin guardar nada", async () => {
    const previa = await vistaPreviaActa(marta, datos(), T0);
    expect(previa.subarray(0, 5).toString()).toBe("%PDF-");
    expect(await prisma.publicacion.count()).toBe(0);
    await expect(vistaPreviaActa(carmen, datos(), T0)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-ASA-11 CA3 al publicar se avisa a cada vecino activo y llega a su centro de avisos", async () => {
    const { acta } = await publicarActa(marta, datos(), T0);
    const vecinos = await prisma.usuario.count({
      where: { roles: { hasSome: ["VECINO", "VECINO_ADULTO_MAYOR"] }, estado: "ACTIVA" },
    });
    expect(await prisma.avisoEnCola.count({ where: { tipo: "ASAMBLEAS" } })).toBe(vecinos);
    await despacharAvisos(new Date(T0.getTime() + 60_000), crearSimulador({}));
    expect(await prisma.notificacion.findMany({ where: { destinatarioId: carmen.usuarioId } })).toMatchObject(
      [{ tipo: "ASAMBLEAS", titulo: "Acta publicada: Asamblea general de octubre" }],
    );
    expect((await actasPublicadas(carmen)).map((a) => a.id)).toEqual([acta.id]);
  });

  it("@HU-ASA-11 CA3 si falla el aviso, el acta tampoco queda publicada", async () => {
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION prueba_falla_cola() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'cola caída'; END; $$`,
    );
    await prisma.$executeRawUnsafe(
      "CREATE TRIGGER prueba_falla_cola BEFORE INSERT ON nucleo_cola_avisos FOR EACH ROW EXECUTE FUNCTION prueba_falla_cola()",
    );
    try {
      await expect(publicarActa(marta, datos(), T0)).rejects.toThrow();
    } finally {
      await prisma.$executeRawUnsafe("DROP TRIGGER prueba_falla_cola ON nucleo_cola_avisos");
      await prisma.$executeRawUnsafe("DROP FUNCTION prueba_falla_cola()");
    }
    expect(await prisma.publicacion.count()).toBe(0);
  });

  it("@HU-ASA-11 el acta publicada es inalterable", async () => {
    const { acta } = await publicarActa(marta, datos(), T0);
    await expect(
      prisma.$executeRaw`UPDATE transparencia_actas SET conclusiones = 'Otra' WHERE "publicacionId" = ${acta.id}`,
    ).rejects.toThrow(/solo admite inserciones/);
    await expect(
      prisma.$executeRaw`DELETE FROM transparencia_actas WHERE "publicacionId" = ${acta.id}`,
    ).rejects.toThrow(/solo admite inserciones/);
  });

  it("@HU-ASA-11 AC-5 repetir con el mismo idOperacion no publica ni avisa dos veces", async () => {
    const mismo = datos();
    const primera = await publicarActa(marta, mismo, T0);
    const repetida = await publicarActa(marta, mismo, T0);
    expect(repetida).toMatchObject({ creado: false, acta: { id: primera.acta.id } });
    expect(await prisma.publicacion.count()).toBe(1);
    expect(await prisma.avisoEnCola.count({ where: { tipo: "ASAMBLEAS" } })).toBe(
      await prisma.usuario.count({
        where: { roles: { hasSome: ["VECINO", "VECINO_ADULTO_MAYOR"] }, estado: "ACTIVA" },
      }),
    );
  });

  it("@HU-ASA-11 AC-6 queda en la auditoría quién publicó el acta", async () => {
    const { acta } = await publicarActa(marta, datos(), T0);
    const fila = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "publicar_acta", entidadId: acta.id },
    });
    expect(fila).toMatchObject({ actorId: marta.usuarioId, entidad: "Acta" });
    expect(fila.antes).toBeNull();
    expect(fila.despues).toMatchObject({
      titulo: "Asamblea general de octubre",
      avisados: expect.any(Number),
    });
  });

  it("@HU-ASA-11 un acta que no existe responde como inexistente", async () => {
    await expect(descargarActa(carmen, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-ASA-11 por la API: publica con 201, repite con 200, vista previa y descarga en PDF", async () => {
    // Por la API se usa la hora real: la fecha de la asamblea tiene que quedar en el pasado.
    const cuerpo = datos({ fechaAsamblea: "2026-09-26" });
    const pedir = (url: string, metodo: string, cookie: string, body?: unknown) =>
      new Request(`http://localhost${url}`, {
        method: metodo,
        headers: { cookie: `sesion=${cookie}` },
        body: body ? JSON.stringify(body) : undefined,
      });
    const primera = await publicarHttp(
      pedir("/api/transparencia/actas", "POST", tokenMarta, cuerpo),
      undefined,
    );
    expect(primera.status).toBe(201);
    const { id } = await primera.json();
    expect(
      (await publicarHttp(pedir("/api/transparencia/actas", "POST", tokenMarta, cuerpo), undefined)).status,
    ).toBe(200);

    const previa = await previaHttp(
      pedir("/api/transparencia/actas/vista-previa", "POST", tokenMarta, {
        ...cuerpo,
        idOperacion: undefined,
      }),
      undefined,
    );
    expect(previa.status).toBe(200);
    expect(previa.headers.get("content-type")).toBe("application/pdf");

    const pdf = await pdfHttp(pedir(`/api/transparencia/actas/${id}/pdf`, "GET", tokenMarta), {
      params: Promise.resolve({ id }),
    });
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-disposition")).toContain("acta-asamblea-general-de-octubre.pdf");
    const sinSesion = await pdfHttp(new Request(`http://localhost/api/transparencia/actas/${id}/pdf`), {
      params: Promise.resolve({ id }),
    });
    expect(sinSesion.status).toBe(401);
  });
});
