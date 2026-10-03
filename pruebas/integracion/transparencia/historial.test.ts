import { randomUUID } from "node:crypto";
import { GET as historialHttp } from "@/app/api/transparencia/historial/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado } from "@/compartido/errores";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { publicarActa } from "@/modulos/transparencia/aplicacion/actas";
import { publicarBalance } from "@/modulos/transparencia/aplicacion/balances";
import { historialPublico } from "@/modulos/transparencia/aplicacion/historial";

const T0 = new Date("2026-10-05T15:00:00Z");
let marta: SesionDto;
let tokenMarta: string;
let carmen: SesionDto;
let comprobante: string;

const acta = (titulo: string, fechaAsamblea: string) =>
  publicarActa(
    marta,
    {
      titulo,
      fechaAsamblea,
      acuerdos: "Se aprobó algo.",
      compromisos: "",
      conclusiones: "",
      idOperacion: randomUUID(),
    },
    T0,
  );
const balance = (titulo: string, fechaActividad: string) =>
  publicarBalance(
    marta,
    {
      titulo,
      fechaActividad,
      ingresosVirtuales: 120000,
      ingresosEnPuerta: 80000,
      egresos: [{ concepto: "Pollos", monto: 90000, archivoId: comprobante }],
      idOperacion: randomUUID(),
    },
    T0,
  );

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones, nucleo_archivos CASCADE`;
  await prisma.$executeRaw`TRUNCATE transparencia_publicaciones CASCADE`;
  await sembrar("clave-de-prueba");
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({
    dni: "40000002",
    clave: "clave-de-prueba",
  }));
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni: "08123478" } });
  carmen = { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
  comprobante = (
    await prisma.archivo.create({
      data: {
        clave: `comprobantes/${randomUUID()}.jpg`,
        tipo: "image/jpeg",
        tamano: 1000,
        uso: "comprobante_egreso",
        subidoPor: marta.usuarioId,
      },
    })
  ).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ASA-12 Historial público de actas y balances", () => {
  it("@HU-ASA-12 CA1 lista actas y balances juntos, del evento más nuevo al más antiguo", async () => {
    await acta("Asamblea de setiembre", "2026-09-12");
    await balance("Pollada de setiembre", "2026-09-26");
    await acta("Asamblea extraordinaria", "2026-09-19");
    const historial = await historialPublico(carmen);
    expect(historial.map((h) => [h.tipo, h.titulo])).toEqual([
      ["BALANCE", "Pollada de setiembre"],
      ["ACTA", "Asamblea extraordinaria"],
      ["ACTA", "Asamblea de setiembre"],
    ]);
  });

  it("@HU-ASA-12 CA2 cada balance muestra ingresos, egresos y saldo final; cada acta, sus acuerdos", async () => {
    await balance("Pollada de setiembre", "2026-09-26");
    await acta("Asamblea de setiembre", "2026-09-12");
    const [b, a] = await historialPublico(carmen);
    expect(b).toMatchObject({
      tipo: "BALANCE",
      fechaEvento: "Sábado 26 de setiembre de 2026",
      totales: { ingresos: 200000, egresos: 90000, utilidadNeta: 110000 },
    });
    expect(a).toMatchObject({ tipo: "ACTA", acuerdos: ["Se aprobó algo."] });
  });

  it("@HU-ASA-12 CA3 es público para todo vecino con sesión y no para quien no la tiene", async () => {
    await acta("Asamblea de setiembre", "2026-09-12");
    expect(await historialPublico(carmen)).toHaveLength(1);
    await expect(
      historialPublico({
        usuarioId: "x",
        nombreCompleto: "Luis",
        roles: ["VIGILANTE"],
        politicaAceptada: true,
      }),
    ).rejects.toBeInstanceOf(ErrorNoAutorizado);
    const respuesta = await historialHttp(
      new Request("http://localhost/api/transparencia/historial"),
      undefined,
    );
    expect(respuesta.status).toBe(401);
  });

  it("@HU-ASA-12 por la API entrega el historial y no muestra los comprobantes de los gastos a un vecino", async () => {
    await balance("Pollada de setiembre", "2026-09-26");
    const respuesta = await historialHttp(
      new Request("http://localhost/api/transparencia/historial", {
        headers: { cookie: `sesion=${tokenMarta}` },
      }),
      undefined,
    );
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject([{ tipo: "BALANCE", titulo: "Pollada de setiembre" }]);
    expect(JSON.stringify(await historialPublico(carmen))).not.toContain(comprobante);
  });
});
