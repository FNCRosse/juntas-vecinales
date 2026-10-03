import { randomUUID } from "node:crypto";
import { POST as registrarHttp } from "@/app/api/quejas/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorValidacion } from "@/compartido/errores";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  bandejaDeQuejas,
  lugaresParaReportar,
  misQuejas,
  quejasPorAtender,
  registrarQueja,
} from "@/modulos/incidencias/aplicacion/quejas";

const T0 = new Date("2026-09-27T15:24:00Z");
const CLAVE = "clave-de-prueba";
let carmen: SesionDto;
let marta: SesionDto;
let tokenMarta: string;
let foto: string;

const datos = (cambios: Partial<Parameters<typeof registrarQueja>[1]> = {}) => ({
  categoria: "RUIDOS",
  descripcion: "Música muy fuerte todas las noches después de las 11 p. m.",
  manzana: "C",
  referencia: "frente al parque",
  evidencias: [foto],
  consentimiento: true,
  idOperacion: randomUUID(),
  ...cambios,
});

const subirFoto = async (subidoPor: string, uso = "evidencia_queja") =>
  (
    await prisma.archivo.create({
      data: { clave: `evidencias/${randomUUID()}.jpg`, tipo: "image/jpeg", tamano: 1000, uso, subidoPor },
    })
  ).id;

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones, nucleo_archivos, incidencias_quejas CASCADE`;
  await sembrar(CLAVE);
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni: "08123478" } });
  carmen = { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
  // Marta es de la directiva y también vecina: entra con clave y reporta por HTTP.
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE }));
  foto = await subirFoto(carmen.usuarioId);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-QUE-01 Registrar una queja con consentimiento y evidencia", () => {
  it("@HU-QUE-01 CA1 CA2 CA3 guarda la queja con su categoría, lugar, evidencia y la versión de la política aceptada", async () => {
    const respuesta = await registrarHttp(
      new Request("http://localhost/api/quejas", {
        method: "POST",
        headers: { cookie: `sesion=${tokenMarta}` },
        body: JSON.stringify(datos({ evidencias: [await subirFoto(marta.usuarioId)] })),
      }),
      undefined,
    );
    expect(respuesta.status).toBe(201);
    const cuerpo = await respuesta.json();
    expect(cuerpo).toMatchObject({
      categoria: "Ruidos molestos",
      lugar: "Mz. C, frente al parque",
      estado: "RECIBIDO",
      evidencias: 1,
    });

    const fila = await prisma.queja.findUniqueOrThrow({
      where: { id: cuerpo.id },
      include: { evidencias: true },
    });
    expect(fila).toMatchObject({
      categoria: "RUIDOS",
      manzana: "C",
      denuncianteId: marta.usuarioId,
      consentimientoVersion: "2026-10",
    });
    expect(fila.evidencias).toHaveLength(1);
    const { queja } = await registrarQueja(carmen, datos(), T0);
    const deCarmen = await prisma.queja.findUniqueOrThrow({
      where: { id: queja.id },
      include: { evidencias: true },
    });
    expect(deCarmen.evidencias.map((e) => e.archivoId)).toEqual([foto]);
  });

  it("@HU-QUE-01 CA1 CA3 sin consentimiento, sin evidencia o sin lugar no se envía y dice qué falta", async () => {
    const respuesta = await registrarHttp(
      new Request("http://localhost/api/quejas", {
        method: "POST",
        headers: { cookie: `sesion=${tokenMarta}` },
        body: JSON.stringify(datos({ consentimiento: false, evidencias: [], manzana: " ", descripcion: "" })),
      }),
      undefined,
    );
    expect(respuesta.status).toBe(400);
    expect(Object.keys((await respuesta.json()).campos).sort()).toEqual([
      "consentimiento",
      "descripcion",
      "evidencias",
      "lugar",
    ]);
    expect(await prisma.queja.count()).toBe(0);
  });

  it("@HU-QUE-01 CA2 la evidencia tiene que ser una foto que subió quien reporta, y la manzana una del padrón", async () => {
    const ajena = await subirFoto(marta.usuarioId);
    await expect(registrarQueja(carmen, datos({ evidencias: [ajena] }), T0)).rejects.toMatchObject({
      campos: { evidencias: "Vuelva a adjuntar la foto o el video: no pudimos encontrarlo." },
    });
    const comprobante = await subirFoto(carmen.usuarioId, "comprobante_egreso");
    await expect(registrarQueja(carmen, datos({ evidencias: [comprobante] }), T0)).rejects.toBeInstanceOf(
      ErrorValidacion,
    );
    await expect(registrarQueja(carmen, datos({ manzana: "Z" }), T0)).rejects.toMatchObject({
      campos: { lugar: "Elija una manzana de la lista." },
    });
  });

  it("@HU-QUE-01 ofrece las manzanas del padrón y la de su casa; solo un vecino puede reportar", async () => {
    expect(await lugaresParaReportar(carmen)).toEqual({ manzanas: ["A", "B", "C", "D"], miManzana: "C" });
    const { sesion: luis } = await iniciarSesionConClave({ dni: "40000004", clave: CLAVE });
    await expect(registrarQueja(luis, datos(), T0)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-QUE-01 AC-5 repetir el envío con el mismo idOperacion no crea otra queja", async () => {
    const pedido = datos();
    const primera = await registrarQueja(carmen, pedido, T0);
    const segunda = await registrarQueja(carmen, pedido, T0);
    expect(segunda).toEqual({ queja: primera.queja, creada: false });
    expect(await prisma.queja.count()).toBe(1);
  });
});

describe("@HU-QUE-04 Ticket correlativo y aviso a la directiva", () => {
  it("@HU-QUE-04 CA1 CA3 emite un código único y correlativo, en RECIBIDO con fecha y hora exactas", async () => {
    const { queja: primera } = await registrarQueja(carmen, datos(), T0);
    const { queja: segunda } = await registrarQueja(carmen, datos({ categoria: "BASURA" }), T0);
    expect(primera.codigo).toMatch(/^Q-2026-\d{5}-[A-HJKMNP-Z2-9]{4}$/);
    expect(primera.codigo).not.toBe(segunda.codigo);
    const [n1, n2] = [primera.codigo, segunda.codigo].map((c) => Number(c.split("-")[2]));
    expect(n2).toBe(n1 + 1);
    expect(primera).toMatchObject({
      estado: "RECIBIDO",
      estadoTexto: "Recibido, pendiente de revisión",
      fechaRegistro: T0.toISOString(),
    });
    expect((await misQuejas(carmen)).map((q) => q.codigo)).toEqual([segunda.codigo, primera.codigo]);
  });

  it("@HU-QUE-04 CA2 avisa a la directiva y al mediador sin el código ni el nombre, y queda en la auditoría", async () => {
    const { queja } = await registrarQueja(carmen, datos(), T0);
    const avisos = await prisma.avisoEnCola.findMany({ where: { tipo: "REPORTES" } });
    const destinatarios = await prisma.usuario.findMany({
      where: { id: { in: avisos.map((a) => a.destinatarioId) } },
      select: { nombreCompleto: true },
      orderBy: { nombreCompleto: "asc" },
    });
    expect(destinatarios.map((d) => d.nombreCompleto)).toEqual(["Marta Rojas", "Pedro Chávez"]);
    expect(avisos[0]).toMatchObject({
      titulo: "Llegó un reporte nuevo",
      texto: `${queja.numero} · Ruidos molestos en Mz. C, frente al parque. Revíselo en Incidentes.`,
    });
    expect(avisos[0].texto).not.toContain(queja.codigo);
    expect(avisos[0].texto).not.toContain("Carmen");

    const registro = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "registrar_queja", entidadId: queja.id },
    });
    expect(registro).toMatchObject({
      actorId: carmen.usuarioId,
      despues: { categoria: "RUIDOS", lugar: "Mz. C, frente al parque", evidencias: 1 },
    });
  });

  it("@HU-QUE-04 CA2 CA3 la bandeja de la directiva muestra el reporte por evaluar y quién lo envía; un vecino no la ve", async () => {
    const { queja } = await registrarQueja(carmen, datos(), T0);
    const bandeja = await bandejaDeQuejas(marta);
    expect(bandeja.conteo).toEqual({ total: 1, porEvaluar: 1, enRevision: 0 });
    expect(bandeja.quejas).toEqual([
      expect.objectContaining({
        numero: queja.numero,
        categoriaTexto: "Ruidos molestos",
        estadoTexto: "Recibido, pendiente de revisión",
        fechaRegistro: T0.toISOString(),
      }),
    ]);
    expect(bandeja.quejas[0].quien).toBe("Carmen Huamán");
    expect((await bandejaDeQuejas(marta, "cerrados")).quejas).toEqual([]);
    expect(await quejasPorAtender(marta)).toEqual({ porEvaluar: 1, enRevision: 0 });
    await expect(bandejaDeQuejas(carmen)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });
});
