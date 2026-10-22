import { GET as estadoHttp } from "@/app/api/aportes/estado-cuenta/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { calcularDeuda, miCuota } from "@/modulos/aportes/aplicacion/deuda";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const LUNES_14 = new Date("2026-09-14T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const LUNES_28 = new Date("2026-09-28T15:00:00Z");

let carmen: SesionDto;
let julio: SesionDto;
let tokenMarta: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const pedir = (token: string | null, ruta = "/api/aportes/estado-cuenta") =>
  new Request(`http://localhost${ruta}`, { headers: token ? { cookie: `sesion=${token}` } : {} });

const cuotaDe = async (dni: string, periodo: string) => {
  const r = await prisma.residencia.findFirstOrThrow({ where: { usuario: { dni }, fechaFin: null } });
  return prisma.cuota.findFirstOrThrow({
    where: { predioId: r.predioId, periodo: new Date(`${periodo}T05:00:00Z`) },
  });
};

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas CASCADE`;
  await sembrar("clave-de-prueba");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  for (const lunes of [LUNES_14, LUNES_21, LUNES_28]) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-02 CA1 El estado de cuenta de la casa", () => {
  it("@HU-COB-02 CA1 trae las semanas pendientes, el historial de lo ya pagado y los conceptos facturados", async () => {
    const pagada = await cuotaDe("08123478", "2026-09-14");
    await prisma.cuota.update({ where: { id: pagada.id }, data: { estado: "PAGADA", saldoPendiente: 0 } });
    const estado = (await miCuota(carmen))!;
    expect(estado.debe).toBe(1000);
    expect(estado.semanas.map((s) => s.semana)).toEqual([
      "Semana del 21 al 27 de setiembre",
      "Semana del 28 de setiembre al 4 de octubre",
    ]);
    expect(estado.historial).toEqual([
      expect.objectContaining({ semana: "Semana del 14 al 20 de setiembre", monto: 500 }),
    ]);
    expect(estado.conceptos.map((c) => [c.nombre, c.monto])).toEqual([
      ["Casa", 250],
      ["Inquilino", 250],
    ]);
  });

  it("@HU-COB-02 CA1 un pago parcial deja el saldo que falta y dice cuánto ya pagó", async () => {
    const cuota = await cuotaDe("08123478", "2026-09-21");
    await prisma.cuota.update({ where: { id: cuota.id }, data: { saldoPendiente: 200 } });
    const { semanas, debe } = (await miCuota(carmen))!;
    expect(semanas.find((s) => s.id === cuota.id)).toMatchObject({ monto: 200, pagado: 300 });
    expect(semanas.find((s) => s.id !== cuota.id)).toMatchObject({ pagado: 0 });
    expect(debe).toBe(500 + 200 + 500);
  });

  it("@HU-COB-02 CA3 se actualiza en cada consulta: un abono nuevo se ve de inmediato", async () => {
    expect((await miCuota(carmen))!.debe).toBe(1500);
    const cuota = await cuotaDe("08123478", "2026-09-14");
    await prisma.cuota.update({ where: { id: cuota.id }, data: { estado: "PAGADA", saldoPendiente: 0 } });
    expect((await miCuota(carmen))!.debe).toBe(1000);
    await prisma.cuota.update({
      where: { id: (await cuotaDe("08123478", "2026-09-21")).id },
      data: { estado: "PAGADA", saldoPendiente: 0 },
    });
    const ahora = (await miCuota(carmen))!;
    expect(ahora.debe).toBe(500);
    expect(ahora.historial).toHaveLength(2);
  });
});

describe("@HU-COB-02 CA2 Solo se ve lo propio", () => {
  it("@HU-COB-02 CA2 AC-7 cada casa ve solo su deuda y su historial", async () => {
    const deJulio = (await miCuota(julio))!;
    expect(deJulio.vivienda).toBe("Mz. A, lote 3");
    expect(deJulio.debe).toBe(1350);
    expect(JSON.stringify(deJulio)).not.toMatch(/Mz\. C|Carmen/);
  });

  it("@HU-COB-02 CA2 el endpoint responde con la casa de quien pide y no acepta pedir otra", async () => {
    const respuesta = await estadoHttp(
      pedir(tokenMarta, "/api/aportes/estado-cuenta?predioId=cualquiera&dni=08123478"),
      undefined,
    );
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get("cache-control")).toBe("private, no-store");
    const cuerpo = await respuesta.json();
    expect(cuerpo).toMatchObject({ vivienda: "Mz. A, lote 12", debe: 750 });
    expect(JSON.stringify(cuerpo)).not.toContain("Mz. C");
  });

  it("@HU-COB-02 CA2 sin sesión responde 401 y quien no vive en una casa no tiene estado de cuenta", async () => {
    expect((await estadoHttp(pedir(null), undefined)).status).toBe(401);
    const { token } = await iniciarSesionConClave({ dni: "40000003", clave: "clave-de-prueba" });
    expect((await estadoHttp(pedir(token), undefined)).status).toBe(404);
    const { token: tokenAdmin } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" });
    expect((await estadoHttp(pedir(tokenAdmin), undefined)).status).toBe(403);
  });
});
