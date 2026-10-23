import { randomUUID } from "node:crypto";
import { GET as pdfHttp } from "@/app/api/aportes/recibos/[id]/pdf/route";
import { POST as enviarHttp } from "@/app/api/aportes/recibos/[id]/enviar/route";
import { POST as confirmarHttp } from "@/app/api/aportes/recibos/[id]/confirmar/route";
import { POST as pedirHttp } from "@/app/api/aportes/recibos-en-papel/route";
import { PATCH as entregarHttp } from "@/app/api/aportes/recibos-en-papel/[id]/entregar/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorReglaNegocio,
  ErrorValidacion,
} from "@/compartido/errores";
import { calcularDeuda } from "@/modulos/aportes/aplicacion/deuda";
import { aprobarComprobante, misPagos, registrarPagoDigital } from "@/modulos/aportes/aplicacion/pagos";
import {
  confirmarRecibo,
  datosParaPedirRecibo,
  entregarReciboEnPapel,
  enviarReciboALaApp,
  pdfDelRecibo,
  pedirReciboEnPapel,
  recibosEnPapelPorEntregar,
  verMiRecibo,
  verReciboDeLaDirectiva,
} from "@/modulos/aportes/aplicacion/recibos";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const LUNES_7 = new Date("2026-09-07T15:00:00Z");
const LUNES_14 = new Date("2026-09-14T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const ENVIO = new Date("2026-09-22T15:18:00Z");
const REVISION = new Date("2026-09-23T14:00:00Z");
const ENVIO_APP = new Date("2026-09-23T14:30:00Z");

let carmen: SesionDto;
let julio: SesionDto;
let marta: SesionDto;
let pedro: SesionDto;
let tokenMarta: string;
let tokenAna: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const foto = (sesion: SesionDto) =>
  prisma.archivo
    .create({
      data: {
        clave: `comprobantes/${randomUUID()}.jpg`,
        tipo: "image/jpeg",
        tamano: 1000,
        uso: "comprobante_pago",
        subidoPor: sesion.usuarioId,
      },
    })
    .then((a) => a.id);

/** La casa manda su pago, la directiva lo aprueba y devuelve el recibo emitido. */
async function pagarYAprobar(sesion: SesionDto, semanas: number) {
  const { pago } = await registrarPagoDigital(
    sesion,
    { semanas, medio: "YAPE_O_PLIN", archivoId: await foto(sesion), idOperacion: randomUUID() },
    ENVIO,
  );
  const comprobante = await prisma.comprobante.findFirstOrThrow({ where: { pagoId: pago.id } });
  const r = await aprobarComprobante(marta, comprobante.id, REVISION);
  return r.recibo!;
}

beforeAll(() => {
  process.env.DATOS_PAGO_YAPE = "987 654 321, a nombre de Junta Vecinal";
  process.env.DATOS_PAGO_CUENTA = "191-2345678-0-12";
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_pedidos_recibo_papel, aportes_recibos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas RESTART IDENTITY CASCADE`;
  await sembrar("clave-de-prueba");
  [carmen, julio, marta, pedro] = await Promise.all(
    ["08123478", "40000006", "40000002", "40000003"].map(sesionDe),
  );
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  ({ token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" }));
  for (const lunes of [LUNES_7, LUNES_14, LUNES_21]) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-12 CA1 El recibo nace con el pago aprobado", () => {
  it("@HU-COB-12 CA1 al aprobar el pago se emite el recibo con su correlativo, predio, fecha, concepto y código", async () => {
    const recibo = await pagarYAprobar(carmen, 3);
    expect(recibo).toMatchObject({
      numero: "000001",
      titular: "Carmen Huamán",
      vivienda: "Mz. C, lote 7",
      fecha: "23 de setiembre de 2026",
      concepto: "Cuota de vigilancia: 3 semanas, del 7 al 27 de setiembre",
      medio: "Yape o Plin",
      monto: 1500,
      registradoPor: "Marta Rojas",
      enviado: null,
      confirmado: null,
    });
    expect(recibo.codigo).toMatch(/^JV-000001-[0-9A-F]{4}$/);
  });

  it("@HU-COB-12 CA1 los recibos son correlativos, uno por pago, y aprobar dos veces no emite otro (AC-5)", async () => {
    const primero = await pagarYAprobar(carmen, 1);
    const segundo = await pagarYAprobar(carmen, 1);
    expect([primero.numero, segundo.numero]).toEqual(["000001", "000002"]);
    const pago = await prisma.pago.findFirstOrThrow({ orderBy: { numero: "asc" } });
    const comprobante = await prisma.comprobante.findFirstOrThrow({ where: { pagoId: pago.id } });
    const otra = await aprobarComprobante(marta, comprobante.id, REVISION);
    expect(otra.aplicado).toBe(false);
    expect(otra.recibo?.numero).toBe("000001");
    expect(await prisma.recibo.count()).toBe(2);
  });

  it("@HU-COB-12 CA1 un pago parcial también tiene su recibo, por lo que pagó", async () => {
    const recibo = await pagarYAprobar(carmen, 1);
    expect(recibo).toMatchObject({
      monto: 500,
      concepto: "Cuota de vigilancia: 1 semana, del 7 al 13 de setiembre",
    });
  });

  it("@HU-COB-12 CA1 un recibo emitido no se puede modificar ni borrar, solo anotar su envío y su confirmación", async () => {
    const recibo = await pagarYAprobar(carmen, 3);
    await expect(prisma.recibo.update({ where: { id: recibo.id }, data: { monto: 1 } })).rejects.toThrow(
      /no se puede modificar/,
    );
    await expect(
      prisma.recibo.update({ where: { id: recibo.id }, data: { titular: "Otra" } }),
    ).rejects.toThrow(/no se puede modificar/);
    await expect(prisma.recibo.delete({ where: { id: recibo.id } })).rejects.toThrow(/no se puede borrar/);
    await prisma.recibo.update({ where: { id: recibo.id }, data: { enviadoEn: ENVIO_APP } });
  });

  it("@HU-COB-12 CA1 la directiva abre el recibo oficial y baja su PDF; el mediador lo ve pero no lo envía", async () => {
    const { id } = await pagarYAprobar(carmen, 3);
    expect(await verReciboDeLaDirectiva(marta, id)).toMatchObject({ numero: "000001", puedeEnviar: true });
    expect(await verReciboDeLaDirectiva(pedro, id)).toMatchObject({ puedeEnviar: false });
    await expect(verReciboDeLaDirectiva(carmen, id)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(verReciboDeLaDirectiva(marta, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
    const { pdf, nombreArchivo } = await pdfDelRecibo(marta, id);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(nombreArchivo).toBe("recibo-000001.pdf");
  });

  it("@HU-COB-12 AC-6 aprobar deja anotado el número del recibo en la auditoría", async () => {
    const recibo = await pagarYAprobar(carmen, 3);
    const pago = await prisma.recibo.findUniqueOrThrow({ where: { id: recibo.id } });
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "aprobar_pago", entidadId: pago.pagoId },
    });
    expect(auditoria.despues).toMatchObject({ recibo: "000001" });
  });
});

describe("@HU-COB-12 CA3 Enviarlo a la app y confirmar que se recibió", () => {
  it("@HU-COB-12 CA3 mientras no se envía, la casa no ve el recibo (ni su PDF)", async () => {
    const { id } = await pagarYAprobar(carmen, 3);
    await expect(verMiRecibo(carmen, id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(pdfDelRecibo(carmen, id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    expect((await misPagos(carmen)).pagos[0].recibo).toBeNull();
  });

  it("@HU-COB-12 CA3 al enviarlo a la app, la casa recibe el aviso y lo ve en Mis pagos con su PDF", async () => {
    const { id } = await pagarYAprobar(carmen, 3);
    const r = await enviarReciboALaApp(marta, id, ENVIO_APP);
    expect(r).toMatchObject({
      aplicado: true,
      recibo: { enviado: "23 de setiembre de 2026 a las 9:30 a. m." },
    });

    const avisos = await prisma.avisoEnCola.findMany({
      where: { destinatarioId: carmen.usuarioId, titulo: "Su recibo está listo" },
    });
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({
      tipo: "PAGOS",
      texto:
        "Su recibo N.° 000001 por S/ 15.00 ya está en Mis pagos y recibos. Ábralo y confirme que lo recibió.",
    });
    expect((await misPagos(carmen)).pagos[0].recibo).toEqual({ id, numero: "000001" });
    expect(await verMiRecibo(carmen, id)).toMatchObject({
      numero: "000001",
      vivienda: "Mz. C, lote 7",
      puedeConfirmar: true,
      puedePedirEnPapel: true,
    });
    expect((await pdfDelRecibo(carmen, id)).nombreArchivo).toBe("recibo-000001.pdf");
  });

  it("@HU-COB-12 AC-5 y AC-6 enviarlo dos veces no avisa dos veces y queda en la auditoría", async () => {
    const { id } = await pagarYAprobar(carmen, 3);
    await enviarReciboALaApp(marta, id, ENVIO_APP);
    expect((await enviarReciboALaApp(marta, id, ENVIO_APP)).aplicado).toBe(false);
    expect(await prisma.avisoEnCola.count({ where: { titulo: "Su recibo está listo" } })).toBe(1);
    expect(await prisma.registroAuditoria.count({ where: { accion: "enviar_recibo", entidadId: id } })).toBe(
      1,
    );
  });

  it("@HU-COB-12 solo la directiva envía el recibo a la app", async () => {
    const { id } = await pagarYAprobar(carmen, 3);
    await expect(enviarReciboALaApp(pedro, id)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(enviarReciboALaApp(carmen, id)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(enviarReciboALaApp(marta, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-12 CA3 la casa confirma que lo recibió, una sola vez, y la confirmación queda auditada", async () => {
    const { id } = await pagarYAprobar(carmen, 3);
    await enviarReciboALaApp(marta, id, ENVIO_APP);
    const hecho = await confirmarRecibo(carmen, id, REVISION);
    expect(hecho).toMatchObject({ aplicado: true, recibo: { puedeConfirmar: false } });
    expect(hecho.recibo.confirmado).not.toBeNull();
    expect((await confirmarRecibo(carmen, id, REVISION)).aplicado).toBe(false);
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "confirmar_recibo", entidadId: id } }),
    ).toBe(1);
  });

  it("@HU-COB-12 AC-7 otra casa no ve, no confirma ni baja el recibo: responde como si no existiera", async () => {
    const { id } = await pagarYAprobar(carmen, 3);
    await enviarReciboALaApp(marta, id, ENVIO_APP);
    await expect(verMiRecibo(julio, id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(confirmarRecibo(julio, id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(pdfDelRecibo(julio, id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });
});

describe("@HU-COB-12 CA2 Recibo en papel", () => {
  const pedir = (sesion: SesionDto, reciboId: string, extra: { franja?: string; nota?: string } = {}) =>
    pedirReciboEnPapel(
      sesion,
      { reciboId, franja: "MANANA", idOperacion: randomUUID(), ...extra },
      ENVIO_APP,
    );

  async function reciboEnviado(sesion = carmen, semanas = 1) {
    const { id } = await pagarYAprobar(sesion, semanas);
    await enviarReciboALaApp(marta, id, ENVIO_APP);
    return id;
  }

  it("@HU-COB-12 CA2 «Pedir mi recibo en papel» ofrece sus recibos enviados y las franjas, con sus datos", async () => {
    const id = await reciboEnviado();
    await pagarYAprobar(carmen, 1); // aprobado pero todavía sin enviar a la app
    const datos = await datosParaPedirRecibo(carmen);
    expect(datos).toMatchObject({ quienPide: "Carmen Huamán", direccion: "Mz. C, lote 7" });
    expect(datos.telefono).toMatch(/^terminado en \d{3}$/);
    expect(datos.recibos).toEqual([
      { valor: id, etiqueta: "Recibo N.° 000001 · S/ 5.00", detalle: "23 de setiembre de 2026" },
    ]);
    expect(datos.franjas.map((f) => f.valor)).toEqual(["MANANA", "TARDE", "NOCHE"]);
  });

  it("@HU-COB-12 CA2 el pedido queda pendiente de visita, avisa a la directiva y se audita", async () => {
    const id = await reciboEnviado();
    const { pedido, creado } = await pedir(carmen, id, { franja: "MANANA", nota: "Tocar el timbre" });
    expect(creado).toBe(true);
    expect(pedido).toMatchObject({
      numero: "R-001",
      recibo: "N.° 000001 · S/ 5.00",
      donde: "En su casa, Mz. C, lote 7",
      franja: "Mañana, de 8:00 a. m. a 12:00 m.",
      estado: "Pendiente de visita",
    });
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: marta.usuarioId, titulo: "Pidieron un recibo en papel" },
    });
    expect(aviso.texto).toBe(
      "Carmen Huamán (Mz. C, lote 7) pidió su recibo N.° 000001 impreso. Véalo en Cobros.",
    );
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "pedir_recibo_papel", entidadId: pedido.id } }),
    ).toBe(1);
    expect((await verMiRecibo(carmen, id)).puedePedirEnPapel).toBe(false);
    expect((await datosParaPedirRecibo(carmen)).recibos).toEqual([]);
  });

  it("@HU-COB-12 AC-5 repetir el mismo pedido devuelve el anterior sin avisar otra vez", async () => {
    const id = await reciboEnviado();
    const idOperacion = randomUUID();
    const datos = { reciboId: id, franja: "TARDE", idOperacion };
    const primero = await pedirReciboEnPapel(carmen, datos, ENVIO_APP);
    const avisos = () => prisma.avisoEnCola.count({ where: { titulo: "Pidieron un recibo en papel" } });
    const antes = await avisos();
    expect(antes).toBeGreaterThan(0);
    const repetido = await pedirReciboEnPapel(carmen, datos, ENVIO_APP);
    expect(repetido).toMatchObject({ creado: false, pedido: { id: primero.pedido.id } });
    expect(await avisos()).toBe(antes);
    expect(await prisma.pedidoReciboPapel.count()).toBe(1);
    await expect(pedirReciboEnPapel(julio, datos, ENVIO_APP)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-12 CA2 hay que elegir la franja, un recibo propio ya enviado, y no se pide dos veces el mismo", async () => {
    const id = await reciboEnviado();
    await expect(pedir(carmen, id, { franja: "" })).rejects.toBeInstanceOf(ErrorValidacion);
    await expect(pedir(carmen, id, { nota: "a".repeat(301) })).rejects.toBeInstanceOf(ErrorValidacion);
    await expect(pedir(julio, id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    const sinEnviar = await pagarYAprobar(carmen, 1);
    await expect(pedir(carmen, sinEnviar.id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await pedir(carmen, id);
    await expect(pedir(carmen, id)).rejects.toBeInstanceOf(ErrorReglaNegocio);
  });

  it("@HU-COB-12 CA2 la directiva ve los recibos en papel por entregar y los marca entregados", async () => {
    const id = await reciboEnviado();
    const { pedido } = await pedir(carmen, id, { franja: "NOCHE", nota: "Después de las 6" });
    expect((await recibosEnPapelPorEntregar(marta)).items).toEqual([
      {
        id: pedido.id,
        numero: "R-001",
        reciboId: id,
        nombre: "Carmen Huamán",
        vivienda: "Mz. C, lote 7",
        recibo: "Recibo N.° 000001 · S/ 5.00",
        fecha: "23 de setiembre de 2026",
        franja: "Noche, de 6:00 p. m. a 8:00 p. m.",
        nota: "Después de las 6",
        puedeEntregar: true,
      },
    ]);
    expect((await recibosEnPapelPorEntregar(pedro)).items[0].puedeEntregar).toBe(false);

    expect((await entregarReciboEnPapel(marta, pedido.id, REVISION)).aplicado).toBe(true);
    expect((await entregarReciboEnPapel(marta, pedido.id, REVISION)).aplicado).toBe(false);
    expect((await recibosEnPapelPorEntregar(marta)).items).toEqual([]);
    expect(
      await prisma.registroAuditoria.count({
        where: { accion: "entregar_recibo_papel", entidadId: pedido.id },
      }),
    ).toBe(1);
    // Ya entregado, la casa puede pedir otro ejemplar.
    expect((await pedir(carmen, id)).creado).toBe(true);
  });

  it("@HU-COB-12 solo la directiva marca la entrega; el vecino ni ve la bandeja", async () => {
    const id = await reciboEnviado();
    const { pedido } = await pedir(carmen, id);
    await expect(entregarReciboEnPapel(pedro, pedido.id)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(entregarReciboEnPapel(carmen, pedido.id)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(recibosEnPapelPorEntregar(carmen)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(entregarReciboEnPapel(marta, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });
});

describe("@HU-COB-12 Endpoints", () => {
  const llamar = <T>(
    manejador: (peticion: Request, contexto: { params: Promise<{ id: string }> }) => Promise<Response>,
    ruta: string,
    token: string | null,
    id = "x",
    cuerpo?: unknown,
    metodo = "POST",
  ) =>
    manejador(
      new Request(`http://localhost${ruta}`, {
        method: metodo,
        headers: { "content-type": "application/json", ...(token ? { cookie: `sesion=${token}` } : {}) },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      }),
      { params: Promise.resolve({ id }) },
    ) as Promise<Response & { _?: T }>;

  it("@HU-COB-12 GET /api/aportes/recibos/{id}/pdf responde el PDF abierto o para descargar; sin sesión 401", async () => {
    const { id } = await pagarYAprobar(carmen, 3);
    const abierto = await llamar(pdfHttp, `/api/aportes/recibos/${id}/pdf`, tokenMarta, id, undefined, "GET");
    expect(abierto.status).toBe(200);
    expect(abierto.headers.get("content-type")).toBe("application/pdf");
    expect(abierto.headers.get("content-disposition")).toMatch(/^inline; filename="recibo-000001\.pdf"/);
    const bajado = await llamar(
      pdfHttp,
      `/api/aportes/recibos/${id}/pdf?descargar=1`,
      tokenMarta,
      id,
      undefined,
      "GET",
    );
    expect(bajado.headers.get("content-disposition")).toMatch(/^attachment/);
    expect((await llamar(pdfHttp, `/api/aportes/recibos/${id}/pdf`, null, id, undefined, "GET")).status).toBe(
      401,
    );
  });

  it("@HU-COB-12 POST /api/aportes/recibos/{id}/enviar envía a la app (200); sin ser directiva, 403", async () => {
    const { id } = await pagarYAprobar(carmen, 3);
    expect((await llamar(enviarHttp, `/api/aportes/recibos/${id}/enviar`, tokenAna, id)).status).toBe(403);
    const r = await llamar(enviarHttp, `/api/aportes/recibos/${id}/enviar`, tokenMarta, id);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ aplicado: true });
  });

  it("@HU-COB-12 confirmar, pedir en papel y marcar entregado responden por HTTP", async () => {
    // Marta paga desde su casa; otra persona de la directiva habría aprobado: aquí se deja el recibo ya enviado.
    const pago = await prisma.pago.create({
      data: {
        idOperacion: randomUUID(),
        predioId: (
          await prisma.residencia.findFirstOrThrow({ where: { usuarioId: marta.usuarioId, fechaFin: null } })
        ).predioId,
        autorId: marta.usuarioId,
        medio: "YAPE_O_PLIN",
        monto: 500,
        estado: "APROBADO",
      },
    });
    const recibo = await prisma.recibo.create({
      data: {
        pagoId: pago.id,
        predioId: pago.predioId,
        titular: "Marta Rojas",
        vivienda: "Mz. A, lote 12",
        concepto: "Cuota de vigilancia: 1 semana, del 7 al 13 de setiembre",
        medio: "Yape o Plin",
        monto: 500,
        fecha: REVISION,
        registradoPor: "Pedro Chávez",
        registradoPorId: pedro.usuarioId,
        enviadoEn: ENVIO_APP,
      },
    });
    const confirmada = await llamar(
      confirmarHttp,
      `/api/aportes/recibos/${recibo.id}/confirmar`,
      tokenMarta,
      recibo.id,
    );
    expect(confirmada.status).toBe(200);
    expect(await confirmada.json()).toMatchObject({ aplicado: true });

    const cuerpo = { reciboId: recibo.id, franja: "TARDE", idOperacion: randomUUID() };
    const pedida = await llamar(pedirHttp, "/api/aportes/recibos-en-papel", tokenMarta, "x", cuerpo);
    expect(pedida.status).toBe(201);
    const { id: pedidoId } = await pedida.json();
    expect((await llamar(pedirHttp, "/api/aportes/recibos-en-papel", tokenMarta, "x", cuerpo)).status).toBe(
      200,
    );
    const sinFranja = await llamar(pedirHttp, "/api/aportes/recibos-en-papel", tokenMarta, "x", {
      ...cuerpo,
      franja: "",
      idOperacion: randomUUID(),
    });
    expect(sinFranja.status).toBe(400);

    const ruta = `/api/aportes/recibos-en-papel/${pedidoId}/entregar`;
    expect((await llamar(entregarHttp, ruta, tokenAna, pedidoId, undefined, "PATCH")).status).toBe(403);
    const entregada = await llamar(entregarHttp, ruta, tokenMarta, pedidoId, undefined, "PATCH");
    expect(entregada.status).toBe(200);
    expect(await entregada.json()).toMatchObject({ aplicado: true });
  });
});
