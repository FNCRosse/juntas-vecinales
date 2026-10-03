import { randomUUID } from "node:crypto";
import { GET as seguimientoHttp } from "@/app/api/quejas/seguimiento/[codigo]/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorEnPausa, ErrorNoEncontrado } from "@/compartido/errores";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { registrarQueja } from "@/modulos/incidencias/aplicacion/quejas";
import { consultarPorCodigo, verMiQueja } from "@/modulos/incidencias/aplicacion/seguimiento";

const T0 = new Date("2026-09-27T15:24:00Z");
let carmen: SesionDto;
let julio: SesionDto;

async function sesionDe(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

async function reportar(sesion: SesionDto, esAnonimo = false) {
  const foto = await prisma.archivo.create({
    data: {
      clave: `evidencias/${randomUUID()}.jpg`,
      tipo: "image/jpeg",
      tamano: 1000,
      uso: "evidencia_queja",
      subidoPor: sesion.usuarioId,
    },
  });
  const { queja } = await registrarQueja(
    sesion,
    {
      categoria: "RUIDOS",
      descripcion: "La vecina del lote 9 pone música muy fuerte",
      manzana: "C",
      referencia: "al lado de la casa de Elena",
      evidencias: [foto.id],
      consentimiento: true,
      esAnonimo,
      idOperacion: randomUUID(),
    },
    T0,
  );
  return queja;
}

const consultar = (codigo: string, ip = "203.0.113.7") =>
  seguimientoHttp(
    new Request(`http://localhost/api/quejas/seguimiento/${encodeURIComponent(codigo)}`, {
      headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
    }),
    { params: Promise.resolve({ codigo: encodeURIComponent(codigo) }) },
  );

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, incidencias_quejas, incidencias_consultas_seguimiento CASCADE`;
  await sembrar("clave-de-prueba");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-QUE-09 Seguimiento por código", () => {
  it("@HU-QUE-09 CA1 CA3 sin sesión, con el código, muestra estado, fecha y categoría sin datos de terceros", async () => {
    const queja = await reportar(carmen, true);
    const respuesta = await consultar(queja.codigo.toLowerCase());
    expect(respuesta.status).toBe(200);
    const avance = await respuesta.json();
    expect(avance).toMatchObject({
      numero: queja.numero,
      categoria: "Ruidos molestos",
      lugar: "Mz. C",
      estado: "RECIBIDO",
      estadoTexto: "Recibido, pendiente de revisión",
      fechaRegistro: T0.toISOString(),
    });
    expect(avance.pasos.map((p: { estado: string }) => p.estado)).toEqual(["hecho", "ahora", "pendiente"]);
    const texto = JSON.stringify(avance);
    for (const dato of ["lote 9", "Elena", "música", "Carmen", carmen.usuarioId]) {
      expect(texto).not.toContain(dato);
    }
  });

  it("@HU-QUE-09 CA1 un código que no existe responde 404 con un mensaje que dice qué hacer", async () => {
    const respuesta = await consultar("Q-2026-99999-ZZZZ");
    expect(respuesta.status).toBe(404);
    expect((await respuesta.json()).error).toContain("Revíselo en su constancia");
  });

  it("@HU-QUE-09 limita los intentos por conexión: el 11.° en 15 minutos espera; otra conexión sigue", async () => {
    const queja = await reportar(carmen);
    for (let i = 0; i < 10; i++) {
      await expect(consultarPorCodigo("Q-2026-00000-AAAA", "198.51.100.4", T0)).rejects.toBeInstanceOf(
        ErrorNoEncontrado,
      );
    }
    await expect(consultarPorCodigo(queja.codigo, "198.51.100.4", T0)).rejects.toBeInstanceOf(ErrorEnPausa);
    expect((await consultar(queja.codigo, "198.51.100.5")).status).toBe(200);
    const despues = new Date(T0.getTime() + 16 * 60 * 1000);
    expect((await consultarPorCodigo(queja.codigo, "198.51.100.4", despues)).codigo).toBe(queja.codigo);
    const filas = await prisma.consultaSeguimiento.findMany();
    expect(JSON.stringify(filas)).not.toContain("198.51.100.4");
  });

  it("@HU-QUE-09 AC-7 desde Mis reportes ve el avance de los suyos, también anónimos; el de otro es 404", async () => {
    const anonima = await reportar(carmen, true);
    const conNombre = await reportar(carmen);
    expect((await verMiQueja(carmen, anonima.id)).codigo).toBe(anonima.codigo);
    expect((await verMiQueja(carmen, conNombre.id)).codigo).toBe(conNombre.codigo);
    await expect(verMiQueja(julio, anonima.id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(verMiQueja(julio, conNombre.id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });
});
