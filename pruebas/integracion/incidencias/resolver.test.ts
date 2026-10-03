import { randomUUID } from "node:crypto";
import { POST as accionesHttp } from "@/app/api/quejas/[id]/acciones/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorConflicto, ErrorNoAutorizado } from "@/compartido/errores";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  evaluarAdmisibilidad,
  resolverQueja,
  verQuejaParaGestion,
} from "@/modulos/incidencias/aplicacion/gestion";
import { registrarQueja } from "@/modulos/incidencias/aplicacion/quejas";
import { consultarPorCodigo } from "@/modulos/incidencias/aplicacion/seguimiento";

const T0 = new Date("2026-09-27T15:24:00Z");
const T2 = new Date("2026-09-29T20:00:00Z");
const CLAVE = "clave-de-prueba";
const DETALLE =
  "El 29 de setiembre, Pedro Chávez conversó con el vecino. Acordaron bajar la música desde las 10 p. m.";
let carmen: SesionDto;
let marta: SesionDto;
let tokenMarta: string;
let pedro: SesionDto;

async function enRevision(esAnonimo = false) {
  const foto = await prisma.archivo.create({
    data: {
      clave: `evidencias/${randomUUID()}.jpg`,
      tipo: "image/jpeg",
      tamano: 1000,
      uso: "evidencia_queja",
      subidoPor: carmen.usuarioId,
    },
  });
  const { queja } = await registrarQueja(
    carmen,
    {
      categoria: "RUIDOS",
      descripcion: "Música muy fuerte",
      manzana: "C",
      evidencias: [foto.id],
      consentimiento: true,
      esAnonimo,
      idOperacion: randomUUID(),
    },
    T0,
  );
  await evaluarAdmisibilidad(marta, queja.id, { decision: "admitir", prioridad: "MEDIA" }, T0);
  await prisma.avisoEnCola.deleteMany();
  return queja;
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, incidencias_quejas, incidencias_consultas_seguimiento CASCADE`;
  await sembrar(CLAVE);
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni: "08123478" } });
  carmen = { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE }));
  ({ sesion: pedro } = await iniciarSesionConClave({ dni: "40000003", clave: CLAVE }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-QUE-06 Acciones correctivas y cierre", () => {
  it("@HU-QUE-06 CA1 CA2 documenta la medida, cierra como Resuelto y se audita", async () => {
    const queja = await enRevision();
    const r = await accionesHttp(
      new Request(`http://localhost/api/quejas/${queja.id}/acciones`, {
        method: "POST",
        headers: { cookie: `sesion=${tokenMarta}` },
        body: JSON.stringify({ medida: "MEDIACION", detalle: DETALLE }),
      }),
      { params: Promise.resolve({ id: queja.id }) },
    );
    expect(r.status).toBe(201);
    expect(await r.json()).toMatchObject({
      estado: "RESUELTO",
      acciones: [
        { medida: "Mediación en persona, con acuerdo", detalle: DETALLE, responsable: "Marta Rojas" },
      ],
    });
    expect(
      await prisma.registroAuditoria.findFirstOrThrow({
        where: { accion: "resolver_queja", entidadId: queja.id },
      }),
    ).toMatchObject({ actorId: marta.usuarioId, despues: { estado: "RESUELTO", medida: "MEDIACION" } });
  });

  it("@HU-QUE-06 CA3 avisa a quien reportó con el detalle de las medidas y lo muestra en su avance", async () => {
    const queja = await enRevision();
    await resolverQueja(pedro, queja.id, { medida: "MEDIACION", detalle: DETALLE }, T2);
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({ where: { destinatarioId: carmen.usuarioId } });
    expect(aviso).toMatchObject({ titulo: "Su reporte se resolvió", plantilla: "novedad_reporte" });
    expect(aviso.texto).toContain(DETALLE);
    const avance = await consultarPorCodigo(queja.codigo, "203.0.113.20", T2);
    expect(avance.novedad).toEqual({ tipo: "exito", titulo: "Su reporte se resolvió", texto: DETALLE });
    expect(avance.pasos.at(-1)).toMatchObject({ titulo: "3. Resuelto", estado: "hecho" });
    expect((await prisma.queja.findUniqueOrThrow({ where: { id: queja.id } })).fechaCierre).toEqual(T2);
  });

  it("@HU-QUE-06 al anónimo se le avisa sin detalle; solo un reporte en revisión, solo la directiva", async () => {
    const anonima = await enRevision(true);
    await expect(
      resolverQueja(carmen, anonima.id, { medida: "OTRA", detalle: "x" }, T2),
    ).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(resolverQueja(marta, anonima.id, { medida: "OTRA" }, T2)).rejects.toMatchObject({
      campos: { detalle: expect.any(String) },
    });
    await resolverQueja(marta, anonima.id, { medida: "OTRA", detalle: DETALLE }, T2);
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({ where: { destinatarioId: carmen.usuarioId } });
    expect(aviso.texto).not.toContain(DETALLE);
    await expect(
      resolverQueja(marta, anonima.id, { medida: "OTRA", detalle: "otra vez" }, T2),
    ).rejects.toBeInstanceOf(ErrorConflicto);
    expect((await verQuejaParaGestion(marta, anonima.id)).acciones).toHaveLength(1);
  });
});
