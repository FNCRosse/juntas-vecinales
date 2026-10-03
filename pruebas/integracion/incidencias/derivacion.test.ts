import { randomUUID } from "node:crypto";
import { POST as derivarHttp } from "@/app/api/quejas/[id]/derivacion/route";
import { GET as oficioHttp } from "@/app/api/quejas/[id]/oficio/route";
import { GET as oficioPorCodigoHttp } from "@/app/api/quejas/seguimiento/[codigo]/oficio/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { hashDeToken } from "@/compartido/claves";
import { ErrorConflicto, ErrorNoEncontrado } from "@/compartido/errores";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { derivarQueja, oficioParaDirectiva } from "@/modulos/incidencias/aplicacion/derivacion";
import { evaluarAdmisibilidad } from "@/modulos/incidencias/aplicacion/gestion";
import { registrarQueja } from "@/modulos/incidencias/aplicacion/quejas";
import { consultarPorCodigo, miOficio } from "@/modulos/incidencias/aplicacion/seguimiento";

const T0 = new Date("2026-09-25T03:00:00Z");
const T1 = new Date("2026-09-27T16:00:00Z");
const CLAVE = "clave-de-prueba";
let elena: SesionDto;
let julio: SesionDto;
let marta: SesionDto;
let tokenMarta: string;

async function sesionDe(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

async function reporte(esAnonimo = false) {
  const evidencias = await Promise.all(
    ["image/jpeg", "image/jpeg", "video/mp4"].map(
      async (tipo) =>
        (
          await prisma.archivo.create({
            data: {
              clave: `evidencias/${randomUUID()}`,
              tipo,
              tamano: 1000,
              uso: "evidencia_queja",
              subidoPor: elena.usuarioId,
            },
          })
        ).id,
    ),
  );
  const { queja } = await registrarQueja(
    elena,
    {
      categoria: "SEGURIDAD",
      descripcion: "Una persona fuerza las rejas de noche",
      manzana: "A",
      referencia: "pasaje 2",
      latitud: -12.0425,
      longitud: -77.0291,
      evidencias,
      consentimiento: true,
      esAnonimo,
      idOperacion: randomUUID(),
    },
    T0,
  );
  return queja;
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, incidencias_quejas, incidencias_consultas_seguimiento CASCADE`;
  await sembrar(CLAVE);
  elena = await sesionDe("40000008");
  julio = await sesionDe("40000006");
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-QUE-07 Expediente y derivación a la PNP o la Municipalidad", () => {
  it("@HU-QUE-07 CA1 CA3 deriva un reporte en revisión: pasa a Derivado, se audita y se avisa con el oficio", async () => {
    const queja = await reporte();
    await evaluarAdmisibilidad(marta, queja.id, { decision: "admitir", prioridad: "ALTA" }, T0);
    const r = await derivarHttp(
      new Request(`http://localhost/api/quejas/${queja.id}/derivacion`, {
        method: "POST",
        headers: { cookie: `sesion=${tokenMarta}` },
        body: JSON.stringify({ entidad: "PNP" }),
      }),
      { params: Promise.resolve({ id: queja.id }) },
    );
    expect(r.status).toBe(201);
    const { oficio } = await r.json();
    expect(oficio).toMatch(/^N\.° \d{3}-2026-JVVF$/);
    expect(await prisma.queja.findUniqueOrThrow({ where: { id: queja.id } })).toMatchObject({
      estado: "DERIVADO_ENTIDAD_EXTERNA",
    });
    expect(
      await prisma.registroAuditoria.findFirstOrThrow({
        where: { accion: "derivar_queja", entidadId: queja.id },
      }),
    ).toMatchObject({ actorId: marta.usuarioId, despues: { entidad: "PNP", oficio } });
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: elena.usuarioId, titulo: "Su reporte pasó a otra entidad" },
    });
    expect(aviso.texto).toContain(oficio);
    const avance = await consultarPorCodigo(queja.codigo, "203.0.113.30", T1);
    expect(avance).toMatchObject({
      estado: "DERIVADO_ENTIDAD_EXTERNA",
      oficio: { entidad: "Policía Nacional del Perú (PNP)", oficio },
      novedad: { titulo: "Su reporte pasó a otra entidad" },
    });
  });

  it("@HU-QUE-07 CA2 el expediente en PDF reúne pruebas, descripción y coordenadas; hay vista previa antes de derivar", async () => {
    const queja = await reporte();
    const previa = await oficioParaDirectiva(marta, queja.id, "MUNICIPALIDAD");
    expect(previa.pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(previa.nombreArchivo).toMatch(/^oficio-reporte-\d{5}\.pdf$/);
    await expect(oficioParaDirectiva(marta, queja.id)).rejects.toMatchObject({
      campos: { entidad: "Elija a qué entidad lo envía." },
    });
    await derivarQueja(marta, queja.id, { entidad: "MUNICIPALIDAD" }, T1);
    const r = await oficioHttp(
      new Request(`http://localhost/api/quejas/${queja.id}/oficio`, {
        headers: { cookie: `sesion=${tokenMarta}` },
      }),
      { params: Promise.resolve({ id: queja.id }) },
    );
    expect(r.headers.get("content-type")).toBe("application/pdf");
    expect(r.headers.get("content-disposition")).toContain("attachment");
  });

  it("@HU-QUE-07 CA3 quien reportó descarga el oficio con su sesión o con su código; otro vecino, no", async () => {
    const queja = await reporte(true);
    await expect(miOficio(elena, queja.id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await derivarQueja(marta, queja.id, { entidad: "PNP" }, T1);
    expect((await miOficio(elena, queja.id)).pdf.subarray(0, 5).toString()).toBe("%PDF-");
    await expect(miOficio(julio, queja.id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    const porCodigo = await oficioPorCodigoHttp(
      new Request(`http://localhost/api/quejas/seguimiento/${queja.codigo}/oficio`, {
        headers: { "x-forwarded-for": "203.0.113.31" },
      }),
      { params: Promise.resolve({ codigo: queja.codigo }) },
    );
    expect(porCodigo.status).toBe(200);
    const token = randomUUID();
    await prisma.sesion.create({ data: { usuarioId: julio.usuarioId, tokenHash: hashDeToken(token) } });
    const ajeno = await oficioHttp(
      new Request(`http://localhost/api/quejas/${queja.id}/oficio`, {
        headers: { cookie: `sesion=${token}` },
      }),
      { params: Promise.resolve({ id: queja.id }) },
    );
    expect(ajeno.status).toBe(404);
  });

  it("@HU-QUE-07 un reporte cerrado no se deriva y la entidad es obligatoria", async () => {
    const queja = await reporte();
    await expect(derivarQueja(marta, queja.id, {}, T1)).rejects.toMatchObject({
      campos: { entidad: "Elija a qué entidad lo envía." },
    });
    await derivarQueja(marta, queja.id, { entidad: "PNP" }, T1);
    await expect(derivarQueja(marta, queja.id, { entidad: "PNP" }, T1)).rejects.toBeInstanceOf(
      ErrorConflicto,
    );
  });
});
