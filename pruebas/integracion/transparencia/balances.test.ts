import { randomUUID } from "node:crypto";
import { GET as verHttp } from "@/app/api/transparencia/balances/[id]/route";
import { POST as publicarHttp } from "@/app/api/transparencia/balances/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { despacharAvisos } from "@/compartido/notificaciones/despachar";
import { crearSimulador } from "@/compartido/notificaciones/whatsapp";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { balancesPublicados, publicarBalance, verBalance } from "@/modulos/transparencia/aplicacion/balances";

const T0 = new Date("2026-10-05T15:00:00Z");
let marta: SesionDto;
let tokenMarta: string;
let carmen: SesionDto;
let comprobante: string;

const datos = (cambios: Partial<Parameters<typeof publicarBalance>[1]> = {}) => ({
  titulo: "Pollada pro fondos de setiembre",
  fechaActividad: "2026-09-27",
  ingresosVirtuales: 120000,
  ingresosEnPuerta: 80000,
  egresos: [
    { concepto: "Pollos y papas", monto: 90000, archivoId: comprobante },
    { concepto: "Alquiler de sillas", monto: 20000, archivoId: comprobante },
  ],
  idOperacion: randomUUID(),
  ...cambios,
});

async function sesionDeVecino(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones, nucleo_archivos CASCADE`;
  await prisma.$executeRaw`TRUNCATE transparencia_publicaciones CASCADE`;
  await sembrar("clave-de-prueba");
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({
    dni: "40000002",
    clave: "clave-de-prueba",
  }));
  carmen = await sesionDeVecino("08123478");
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

describe("@HU-ASA-10 Balance de ingresos y egresos de actividades pro fondos", () => {
  it("@HU-ASA-10 CA1 desglosa ingresos virtuales y en puerta y guarda cada gasto con su comprobante", async () => {
    const { balance, creado } = await publicarBalance(marta, datos(), T0);
    expect(creado).toBe(true);
    expect(balance).toMatchObject({
      titulo: "Pollada pro fondos de setiembre",
      fechaActividad: "Domingo 27 de setiembre de 2026",
      ingresosVirtuales: 120000,
      ingresosEnPuerta: 80000,
      autor: "Marta Rojas",
      egresos: [
        { concepto: "Pollos y papas", monto: 90000, comprobanteId: comprobante },
        { concepto: "Alquiler de sillas", monto: 20000, comprobanteId: comprobante },
      ],
    });
    expect(await prisma.egreso.count()).toBe(2);
  });

  it("@HU-ASA-10 CA2 calcula ingresos, egresos y utilidad neta en céntimos para el gráfico y su tabla", async () => {
    const { balance } = await publicarBalance(marta, datos(), T0);
    expect(balance.totales).toEqual({ ingresos: 200000, egresos: 110000, utilidadNeta: 90000 });
    const perdida = await publicarBalance(
      marta,
      datos({
        ingresosVirtuales: 0,
        ingresosEnPuerta: 5000,
        egresos: [{ concepto: "Sonido", monto: 7550, archivoId: comprobante }],
      }),
      T0,
    );
    expect(perdida.balance.totales.utilidadNeta).toBe(-2550);
  });

  it("@HU-ASA-10 CA1 solo la directiva publica y cada gasto debe llevar un comprobante propio y existente", async () => {
    await expect(publicarBalance(carmen, datos(), T0)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    const sinFoto = await publicarBalance(
      marta,
      datos({ egresos: [{ concepto: "Sonido", monto: 5000, archivoId: randomUUID() }] }),
      T0,
    ).catch((e) => e);
    expect(sinFoto).toBeInstanceOf(ErrorValidacion);
    expect(sinFoto.campos).toEqual({
      "egresos.0.archivoId": "Adjunte la foto del comprobante de este gasto.",
    });

    // Un comprobante subido por otra persona no se puede usar.
    const ajeno = await prisma.archivo.create({
      data: {
        clave: "comprobantes/x.jpg",
        tipo: "image/jpeg",
        tamano: 10,
        uso: "comprobante_egreso",
        subidoPor: randomUUID(),
      },
    });
    const error = await publicarBalance(
      marta,
      datos({ egresos: [{ concepto: "Sonido", monto: 5000, archivoId: ajeno.id }] }),
      T0,
    ).catch((e) => e);
    expect(error.campos).toEqual({ "egresos.0.archivoId": "Adjunte la foto del comprobante de este gasto." });
    expect(await prisma.publicacion.count()).toBe(0);
  });

  it("@HU-ASA-10 CA3 se publica de forma inalterable: la base rechaza modificar o borrar el balance y sus gastos", async () => {
    const { balance } = await publicarBalance(marta, datos(), T0);
    await expect(
      prisma.$executeRaw`UPDATE transparencia_balances SET "ingresosEnPuerta" = 1 WHERE "publicacionId" = ${balance.id}`,
    ).rejects.toThrow(/solo admite inserciones/);
    await expect(prisma.$executeRaw`UPDATE transparencia_egresos SET monto = 1`).rejects.toThrow(
      /solo admite inserciones/,
    );
    await expect(prisma.$executeRaw`DELETE FROM transparencia_egresos`).rejects.toThrow(
      /solo admite inserciones/,
    );
    await expect(prisma.$executeRaw`DELETE FROM transparencia_balances`).rejects.toThrow(
      /solo admite inserciones/,
    );
  });

  it("@HU-ASA-10 CA3 el vecino lo ve en transparencia sin los comprobantes, y le llega el aviso a su centro", async () => {
    const { balance } = await publicarBalance(marta, datos(), T0);
    const visto = await verBalance(carmen, balance.id);
    expect(visto.egresos).toEqual([
      { concepto: "Pollos y papas", monto: 90000, comprobanteId: null },
      { concepto: "Alquiler de sillas", monto: 20000, comprobanteId: null },
    ]);
    expect((await verBalance(marta, balance.id)).egresos[0].comprobanteId).toBe(comprobante);
    expect((await balancesPublicados(carmen)).map((b) => b.id)).toEqual([balance.id]);

    await despacharAvisos(new Date(T0.getTime() + 60_000), crearSimulador({}));
    expect(await prisma.notificacion.findMany({ where: { destinatarioId: carmen.usuarioId } })).toMatchObject(
      [{ tipo: "ASAMBLEAS", titulo: "Balance publicado: Pollada pro fondos de setiembre" }],
    );
    await expect(verBalance(carmen, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-ASA-10 si falla el aviso, el balance tampoco queda publicado", async () => {
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION prueba_falla_cola() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'cola caída'; END; $$`,
    );
    await prisma.$executeRawUnsafe(
      "CREATE TRIGGER prueba_falla_cola BEFORE INSERT ON nucleo_cola_avisos FOR EACH ROW EXECUTE FUNCTION prueba_falla_cola()",
    );
    try {
      await expect(publicarBalance(marta, datos(), T0)).rejects.toThrow();
    } finally {
      await prisma.$executeRawUnsafe("DROP TRIGGER prueba_falla_cola ON nucleo_cola_avisos");
      await prisma.$executeRawUnsafe("DROP FUNCTION prueba_falla_cola()");
    }
    expect(await prisma.publicacion.count()).toBe(0);
    expect(await prisma.egreso.count()).toBe(0);
  });

  it("@HU-ASA-10 AC-5 repetir con el mismo idOperacion no publica, no suma gastos ni avisa dos veces", async () => {
    const mismo = datos();
    const primera = await publicarBalance(marta, mismo, T0);
    const repetida = await publicarBalance(marta, mismo, T0);
    expect(repetida).toMatchObject({ creado: false, balance: { id: primera.balance.id } });
    expect(await prisma.publicacion.count()).toBe(1);
    expect(await prisma.egreso.count()).toBe(2);
  });

  it("@HU-ASA-10 AC-6 queda en la auditoría quién publicó el balance, con sus totales", async () => {
    const { balance } = await publicarBalance(marta, datos(), T0);
    const fila = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "publicar_balance", entidadId: balance.id },
    });
    expect(fila).toMatchObject({ actorId: marta.usuarioId, entidad: "Balance" });
    expect(fila.despues).toMatchObject({
      titulo: "Pollada pro fondos de setiembre",
      ingresos: 200000,
      egresos: 110000,
      utilidadNeta: 90000,
    });
  });

  it("@HU-ASA-10 por la API: publica con 201, repite con 200 y lee el balance", async () => {
    const cuerpo = datos({ fechaActividad: "2026-09-26" });
    const pedir = (url: string, metodo: string, body?: unknown) =>
      new Request(`http://localhost${url}`, {
        method: metodo,
        headers: { cookie: `sesion=${tokenMarta}` },
        body: body ? JSON.stringify(body) : undefined,
      });
    const primera = await publicarHttp(pedir("/api/transparencia/balances", "POST", cuerpo), undefined);
    expect(primera.status).toBe(201);
    const { id } = await primera.json();
    expect((await publicarHttp(pedir("/api/transparencia/balances", "POST", cuerpo), undefined)).status).toBe(
      200,
    );
    const leido = await verHttp(pedir(`/api/transparencia/balances/${id}`, "GET"), {
      params: Promise.resolve({ id }),
    });
    expect(leido.status).toBe(200);
    expect((await leido.json()).totales).toEqual({ ingresos: 200000, egresos: 110000, utilidadNeta: 90000 });
    const malo = await publicarHttp(
      pedir("/api/transparencia/balances", "POST", { ...cuerpo, idOperacion: "no-es-uuid" }),
      undefined,
    );
    expect(malo.status).toBe(400);
  });
});
