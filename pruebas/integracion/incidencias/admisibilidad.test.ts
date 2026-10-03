import { randomUUID } from "node:crypto";
import { PATCH as admisibilidadHttp } from "@/app/api/quejas/[id]/admisibilidad/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorConflicto, ErrorNoAutorizado, ErrorNoEncontrado } from "@/compartido/errores";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { evaluarAdmisibilidad, verQuejaParaGestion } from "@/modulos/incidencias/aplicacion/gestion";
import { registrarQueja } from "@/modulos/incidencias/aplicacion/quejas";
import { consultarPorCodigo } from "@/modulos/incidencias/aplicacion/seguimiento";

const T0 = new Date("2026-09-27T15:24:00Z");
const T1 = new Date("2026-09-28T14:00:00Z");
const CLAVE = "clave-de-prueba";
let carmen: SesionDto;
let marta: SesionDto;
let tokenMarta: string;

async function reportar(esAnonimo = false, extra: { latitud?: number; longitud?: number } = {}) {
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
      descripcion: "Música muy fuerte todas las noches",
      manzana: "C",
      referencia: "frente al parque",
      evidencias: [foto.id],
      consentimiento: true,
      esAnonimo,
      idOperacion: randomUUID(),
      ...extra,
    },
    T0,
  );
  return queja;
}

const pedir = (id: string, cuerpo: unknown) =>
  admisibilidadHttp(
    new Request(`http://localhost/api/quejas/${id}/admisibilidad`, {
      method: "PATCH",
      headers: { cookie: `sesion=${tokenMarta}` },
      body: JSON.stringify(cuerpo),
    }),
    { params: Promise.resolve({ id }) },
  );

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, incidencias_quejas, incidencias_consultas_seguimiento CASCADE`;
  await sembrar(CLAVE);
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni: "08123478" } });
  carmen = { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-QUE-05 Admisibilidad", () => {
  it("@HU-QUE-05 CA1 la directiva ve lo reportado, quién, las coordenadas y las evidencias", async () => {
    const queja = await reportar(false, { latitud: -12.0431, longitud: -77.0282 });
    const vista = await verQuejaParaGestion(marta, queja.id);
    expect(vista).toMatchObject({
      categoria: "Ruidos molestos",
      descripcion: "Música muy fuerte todas las noches",
      lugar: "Mz. C, frente al parque",
      coordenadas: "-12.0431, -77.0282",
      quien: "Carmen Huamán",
      evidencias: [{ nombre: "Foto 1" }],
      estado: "RECIBIDO",
    });
    await expect(verQuejaParaGestion(carmen, queja.id)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(verQuejaParaGestion(marta, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-QUE-05 CA2 si procede, asigna prioridad, pasa a En revisión, se audita y se avisa al vecino", async () => {
    const queja = await reportar();
    const r = await pedir(queja.id, { decision: "admitir", prioridad: "ALTA" });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({
      estado: "EN_REVISION",
      prioridad: "Alta",
      evaluadaPor: "Marta Rojas",
    });
    expect(
      await prisma.registroAuditoria.findFirstOrThrow({
        where: { accion: "admitir_queja", entidadId: queja.id },
      }),
    ).toMatchObject({
      actorId: marta.usuarioId,
      antes: { estado: "RECIBIDO" },
      despues: { estado: "EN_REVISION", prioridad: "ALTA" },
    });
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({ where: { destinatarioId: carmen.usuarioId } });
    expect(aviso).toMatchObject({
      tipo: "REPORTES",
      titulo: "La directiva revisa su reporte",
      telefono: "51900000005",
      plantilla: "novedad_reporte",
      parametros: [],
    });
    const avance = await consultarPorCodigo(queja.codigo, "203.0.113.9", T1);
    expect(avance.novedad).toMatchObject({ titulo: "La directiva revisa su reporte" });
  });

  it("@HU-QUE-05 CA3 si es falso, pasa a No procede con su motivo y una advertencia sin tono punitivo", async () => {
    const queja = await reportar();
    await evaluarAdmisibilidad(
      marta,
      queja.id,
      { decision: "rechazar", motivo: "Es la misma queja que el N.° 00001." },
      T1,
    );
    const fila = await prisma.queja.findUniqueOrThrow({ where: { id: queja.id } });
    expect(fila).toMatchObject({
      estado: "RECHAZADO",
      motivoRechazo: "Es la misma queja que el N.° 00001.",
      fechaEvaluacion: T1,
    });
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({ where: { destinatarioId: carmen.usuarioId } });
    expect(aviso.titulo).toBe("Su reporte no procede");
    expect(aviso.texto).toContain("Le pedimos usar los reportes solo para problemas reales del barrio");
    expect(aviso.texto).not.toMatch(/sanci|multa|castig|bloque/i);
    expect((await consultarPorCodigo(queja.codigo, "203.0.113.9", T1)).novedad?.texto).toContain(
      "Es la misma queja",
    );
  });

  it("@HU-QUE-05 al anónimo se le avisa sin código ni detalle; exige prioridad o motivo; no se evalúa dos veces", async () => {
    const anonima = await reportar(true);
    await expect(evaluarAdmisibilidad(marta, anonima.id, { decision: "admitir" }, T1)).rejects.toMatchObject({
      campos: { prioridad: "Elija la prioridad." },
    });
    expect((await pedir(anonima.id, { decision: "rechazar", motivo: " " })).status).toBe(400);
    await evaluarAdmisibilidad(marta, anonima.id, { decision: "admitir", prioridad: "MEDIA" }, T1);
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({ where: { destinatarioId: carmen.usuarioId } });
    expect(aviso).toMatchObject({
      titulo: "Hay novedades en su reporte anónimo",
      texto: "Consúltelo con su código de seguimiento, en Incidentes.",
    });
    expect(JSON.stringify(aviso)).not.toContain(anonima.codigo);
    await expect(
      evaluarAdmisibilidad(marta, anonima.id, { decision: "rechazar", motivo: "x" }, T1),
    ).rejects.toBeInstanceOf(ErrorConflicto);
  });
});
