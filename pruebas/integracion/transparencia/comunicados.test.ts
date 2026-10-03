import { randomUUID } from "node:crypto";
import { GET as feedHttp, POST as publicarHttp } from "@/app/api/transparencia/comunicados/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorValidacion } from "@/compartido/errores";
import { despacharAvisos } from "@/compartido/notificaciones/despachar";
import { crearSimulador } from "@/compartido/notificaciones/whatsapp";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  publicarComunicado,
  ultimasNoticias,
  verNoticias,
} from "@/modulos/transparencia/aplicacion/comunicados";

const T0 = new Date("2026-10-05T15:00:00Z");
const horas = (h: number) => new Date(T0.getTime() + h * 3_600_000);
let marta: SesionDto;
let tokenMarta: string;
let carmen: SesionDto;

const datos = (cambios: Partial<Parameters<typeof publicarComunicado>[1]> = {}) => ({
  titulo: "Corte de agua el miércoles",
  cuerpo: "Sedapal cortará el agua de 9:00 a 13:00. Guarde agua desde la noche anterior.",
  urgencia: "INFORMATIVO" as const,
  idOperacion: randomUUID(),
  ...cambios,
});

async function sesionDeVecino(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

beforeEach(async () => {
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

describe("@HU-ASA-15 Comunicados generales y feed comunitario", () => {
  it("@HU-ASA-15 CA1 la directiva publica un comunicado fuera de las convocatorias de asamblea", async () => {
    const { comunicado, creado } = await publicarComunicado(marta, datos(), T0);
    expect(creado).toBe(true);
    expect(comunicado).toMatchObject({
      titulo: "Corte de agua el miércoles",
      urgencia: "INFORMATIVO",
      autor: "Marta Rojas",
      fecha: T0.toISOString(),
    });
    const fila = await prisma.publicacion.findUniqueOrThrow({ where: { id: comunicado.id } });
    expect(fila).toMatchObject({ tipo: "COMUNICADO", autorId: marta.usuarioId, corrigeAId: null });
  });

  it("@HU-ASA-15 CA1 solo la directiva publica: un vecino recibe 403 y no queda nada", async () => {
    await expect(publicarComunicado(carmen, datos(), T0)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    expect(await prisma.publicacion.count()).toBe(0);
  });

  it("@HU-ASA-15 CA1 rechaza el comunicado sin título o sin mensaje y dice cuál falta", async () => {
    const error = await publicarComunicado(marta, datos({ titulo: "", cuerpo: " " }), T0).catch((e) => e);
    expect(error).toBeInstanceOf(ErrorValidacion);
    expect(error.campos).toEqual({
      titulo: "Escriba el título del comunicado.",
      cuerpo: "Escriba el mensaje del comunicado.",
    });
  });

  it("@HU-ASA-15 CA2 aparece en el feed de cada vecino y genera un aviso para cada vecino activo", async () => {
    const { comunicado } = await publicarComunicado(marta, datos(), T0);
    expect((await verNoticias(carmen)).map((n) => n.id)).toEqual([comunicado.id]);

    const vecinos = await prisma.usuario.findMany({
      where: { roles: { hasSome: ["VECINO", "VECINO_ADULTO_MAYOR"] }, estado: "ACTIVA" },
    });
    const avisos = await prisma.avisoEnCola.findMany({ where: { tipo: "NOTICIAS" } });
    expect(avisos.map((a) => a.destinatarioId).sort()).toEqual(vecinos.map((v) => v.id).sort());
    expect(avisos[0]).toMatchObject({ titulo: "Corte de agua el miércoles", plantilla: null });
    // El vigilante y el administrador (sin rol de vecino) no reciben el aviso.
    const vigilante = await prisma.usuario.findUniqueOrThrow({ where: { dni: "40000004" } });
    expect(avisos.some((a) => a.destinatarioId === vigilante.id)).toBe(false);
  });

  it("@HU-ASA-15 CA2 ADR-006 la copia interna llega al centro de avisos de cada vecino", async () => {
    await publicarComunicado(marta, datos(), T0);
    await despacharAvisos(horas(1), crearSimulador({}));
    const recibidas = await prisma.notificacion.findMany({ where: { destinatarioId: carmen.usuarioId } });
    expect(recibidas).toMatchObject([{ tipo: "NOTICIAS", titulo: "Corte de agua el miércoles" }]);
  });

  it("@HU-ASA-15 CA2 si algo falla al encolar, el comunicado tampoco queda publicado", async () => {
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION prueba_falla_cola() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'cola caída'; END; $$`,
    );
    await prisma.$executeRawUnsafe(
      "CREATE TRIGGER prueba_falla_cola BEFORE INSERT ON nucleo_cola_avisos FOR EACH ROW EXECUTE FUNCTION prueba_falla_cola()",
    );
    try {
      await expect(publicarComunicado(marta, datos(), T0)).rejects.toThrow();
    } finally {
      await prisma.$executeRawUnsafe("DROP TRIGGER prueba_falla_cola ON nucleo_cola_avisos");
      await prisma.$executeRawUnsafe("DROP FUNCTION prueba_falla_cola()");
    }
    expect(await prisma.publicacion.count()).toBe(0);
  });

  it("@HU-ASA-15 CA3 clasifica por urgencia: los urgentes salen primero con su etiqueta", async () => {
    await publicarComunicado(marta, datos({ titulo: "Reunión de limpieza" }), horas(0));
    await publicarComunicado(marta, datos({ titulo: "Se cortó la luz", urgencia: "URGENTE" }), horas(1));
    await publicarComunicado(marta, datos({ titulo: "Nuevo horario del serenazgo" }), horas(2));
    const feed = await verNoticias(carmen);
    expect(feed.map((n) => [n.titulo, n.urgencia])).toEqual([
      ["Se cortó la luz", "URGENTE"],
      ["Nuevo horario del serenazgo", "INFORMATIVO"],
      ["Reunión de limpieza", "INFORMATIVO"],
    ]);
    expect((await ultimasNoticias(carmen, 2)).map((n) => n.titulo)).toEqual([
      "Se cortó la luz",
      "Nuevo horario del serenazgo",
    ]);
  });

  it("@HU-ASA-15 una publicación emitida es inalterable: la base rechaza modificarla o borrarla", async () => {
    const { comunicado } = await publicarComunicado(marta, datos(), T0);
    await expect(
      prisma.$executeRaw`UPDATE transparencia_publicaciones SET titulo = 'Otro' WHERE id = ${comunicado.id}`,
    ).rejects.toThrow(/solo admite inserciones/);
    await expect(
      prisma.$executeRaw`DELETE FROM transparencia_comunicados WHERE "publicacionId" = ${comunicado.id}`,
    ).rejects.toThrow(/solo admite inserciones/);
    await expect(prisma.$executeRaw`DELETE FROM transparencia_publicaciones`).rejects.toThrow(
      /solo admite inserciones/,
    );
  });

  it("@HU-ASA-15 AC-5 repetir la petición con el mismo idOperacion no publica ni avisa dos veces", async () => {
    const mismo = datos();
    const primera = await publicarComunicado(marta, mismo, T0);
    const repetida = await publicarComunicado(marta, mismo, horas(1));
    expect(repetida).toMatchObject({ creado: false, comunicado: { id: primera.comunicado.id } });
    expect(await prisma.publicacion.count()).toBe(1);
    expect(await prisma.avisoEnCola.count({ where: { tipo: "NOTICIAS" } })).toBe(
      await prisma.usuario.count({
        where: { roles: { hasSome: ["VECINO", "VECINO_ADULTO_MAYOR"] }, estado: "ACTIVA" },
      }),
    );
  });

  it("@HU-ASA-15 AC-6 queda en la auditoría quién publicó, qué y a cuántos avisó", async () => {
    const { comunicado } = await publicarComunicado(marta, datos({ urgencia: "URGENTE" }), T0);
    const fila = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "publicar_comunicado", entidadId: comunicado.id },
    });
    expect(fila).toMatchObject({ actorId: marta.usuarioId, entidad: "Comunicado", entidadId: comunicado.id });
    expect(fila.antes).toBeNull();
    expect(fila.despues).toMatchObject({
      titulo: "Corte de agua el miércoles",
      urgencia: "URGENTE",
      avisados: expect.any(Number),
    });
  });

  it("@HU-ASA-15 por la API: la directiva publica con 201, repite con 200 y el vecino lee el feed", async () => {
    const cuerpo = datos();
    const publicar = (cookie: string) =>
      publicarHttp(
        new Request("http://localhost/api/transparencia/comunicados", {
          method: "POST",
          headers: { cookie: `sesion=${cookie}` },
          body: JSON.stringify(cuerpo),
        }),
        undefined,
      );
    expect((await publicar(tokenMarta)).status).toBe(201);
    expect((await publicar(tokenMarta)).status).toBe(200);
    const { token } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" });
    const feed = await feedHttp(
      new Request("http://localhost/api/transparencia/comunicados", {
        headers: { cookie: `sesion=${token}` },
      }),
      undefined,
    );
    expect(feed.status).toBe(200);
    expect(await feed.json()).toMatchObject([{ titulo: "Corte de agua el miércoles" }]);
    const sinSesion = await feedHttp(
      new Request("http://localhost/api/transparencia/comunicados"),
      undefined,
    );
    expect(sinSesion.status).toBe(401);
  });
});
