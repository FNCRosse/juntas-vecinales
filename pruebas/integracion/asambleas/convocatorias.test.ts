import { randomUUID } from "node:crypto";
import { GET as listarHttp, POST as publicarHttp } from "@/app/api/asambleas/route";
import { GET as aficheHttp } from "@/app/api/asambleas/[id]/afiche/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { fechaLarga, horaCorta } from "@/compartido/fechas";
import {
  aficheDeAsamblea,
  proximaAsamblea,
  publicarConvocatoria,
  verAsamblea,
} from "@/modulos/asambleas/aplicacion/convocatorias";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

let directiva: SesionDto;
let tokenDirectiva: string;
let vecino: SesionDto;

async function sesionDe(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

const CONVOCATORIA = {
  tipoAsamblea: "ORDINARIA" as const,
  fecha: "2026-11-14",
  hora: "18:00",
  lugar: "Local comunal del Parque Central",
  motivo: "Aprobar el presupuesto para cámaras de seguridad en las entradas del barrio.",
};

const pedir = (url: string, metodo = "GET", cuerpo?: unknown, token = tokenDirectiva) =>
  new Request(`http://localhost${url}`, {
    method: metodo,
    headers: { cookie: `sesion=${token}` },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

const publicar = (cuerpo: Record<string, unknown>) =>
  publicarHttp(pedir("/api/asambleas", "POST", cuerpo), {});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, asambleas_convocatorias, asambleas_asambleas CASCADE`;
  await sembrar("clave-de-prueba");
  ({ sesion: directiva, token: tokenDirectiva } = await iniciarSesionConClave({
    dni: "40000002",
    clave: "clave-de-prueba",
  }));
  vecino = await sesionDe("40000006");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-01 Convocatoria con versión imprimible", () => {
  it("@HU-ASA-01 CA1 publica la convocatoria y la deja en el feed de asambleas", async () => {
    const respuesta = await publicar({ ...CONVOCATORIA, idOperacion: randomUUID() });
    expect(respuesta.status).toBe(201);
    const asamblea = await respuesta.json();
    expect(asamblea.estado).toBe("PUBLICADA");
    expect(asamblea.titulo).toBe("Asamblea ordinaria");

    const lista = await (await listarHttp(pedir("/api/asambleas"), {})).json();
    expect(lista).toHaveLength(1);
    expect(lista[0].id).toBe(asamblea.id);
  });

  it("@HU-ASA-01 CA1 avisa a cada vecino activo en su centro de avisos", async () => {
    await publicar({ ...CONVOCATORIA, idOperacion: randomUUID() });
    const avisos = await prisma.avisoEnCola.findMany();
    const vecinos = await prisma.residencia.count({ where: { fechaFin: null } });
    expect(avisos.length).toBeGreaterThan(0);
    expect(avisos.length).toBe(vecinos);
    expect(avisos.every((a) => a.tipo === "ASAMBLEAS")).toBe(true);
  });

  it("@HU-ASA-01 CA2 genera el afiche imprimible en PDF", async () => {
    const asamblea = await (await publicar({ ...CONVOCATORIA, idOperacion: randomUUID() })).json();
    const respuesta = await aficheHttp(pedir(`/api/asambleas/${asamblea.id}/afiche`), {
      params: Promise.resolve({ id: asamblea.id }),
    });
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("content-type")).toBe("application/pdf");
    const bytes = Buffer.from(await respuesta.arrayBuffer());
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("@HU-ASA-01 CA3 el afiche usa los mismos datos de la publicación", async () => {
    const asamblea = await verAsamblea(
      directiva,
      (await (await publicar({ ...CONVOCATORIA, idOperacion: randomUUID() })).json()).id,
    );
    const afiche = aficheDeAsamblea(asamblea);
    const filas = Object.fromEntries(afiche.secciones[0].filas!);
    const fecha = new Date(asamblea.fechaHora);
    expect(filas.Fecha).toBe(fechaLarga(fecha));
    expect(filas.Hora).toBe(horaCorta(fecha));
    expect(filas.Lugar).toBe(CONVOCATORIA.lugar);
    expect(afiche.secciones[1].parrafos).toEqual([CONVOCATORIA.motivo]);
  });

  it("@HU-ASA-01 AC-5 reintentar con el mismo idOperacion no publica ni avisa dos veces", async () => {
    const idOperacion = randomUUID();
    const primera = await publicar({ ...CONVOCATORIA, idOperacion });
    const segunda = await publicar({ ...CONVOCATORIA, idOperacion });
    expect(primera.status).toBe(201);
    expect(segunda.status).toBe(200);
    expect((await primera.json()).id).toBe((await segunda.json()).id);
    expect(await prisma.convocatoria.count()).toBe(1);
    const avisos = await prisma.avisoEnCola.count();
    const vecinos = await prisma.residencia.count({ where: { fechaFin: null } });
    expect(avisos).toBe(vecinos);
  });

  it("@HU-ASA-01 AC-6 audita la publicación en la misma transacción", async () => {
    const asamblea = await (await publicar({ ...CONVOCATORIA, idOperacion: randomUUID() })).json();
    const auditoria = await prisma.registroAuditoria.findFirst({
      where: { accion: "publicar_convocatoria", entidadId: asamblea.id },
    });
    expect(auditoria?.actorId).toBe(directiva.usuarioId);
  });

  it("@HU-ASA-01 CA1 rechaza datos incompletos con un mensaje en lenguaje llano", async () => {
    const respuesta = await publicar({ ...CONVOCATORIA, motivo: "   ", idOperacion: randomUUID() });
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).campos.motivo).toMatch(/motivo/i);
  });

  it("@HU-ASA-01 CA1 solo la directiva o el mediador pueden convocar", async () => {
    await expect(
      publicarConvocatoria(vecino, {
        ...CONVOCATORIA,
        fechaHora: new Date("2026-11-14T23:00:00Z"),
        idOperacion: randomUUID(),
      }),
    ).rejects.toThrow();
    expect(await prisma.convocatoria.count()).toBe(0);
  });

  it("@HU-ASA-01 la próxima asamblea es la convocada", async () => {
    const asamblea = await (await publicar({ ...CONVOCATORIA, idOperacion: randomUUID() })).json();
    const proxima = await proximaAsamblea(directiva, new Date("2026-10-20T12:00:00Z"));
    expect(proxima?.id).toBe(asamblea.id);
  });
});
