import { randomUUID } from "node:crypto";
import { POST as pagarHttp } from "@/app/api/aportes/pagos/digital/route";
import { GET as constanciaHttp } from "@/app/api/aportes/pagos/[id]/constancia/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { calcularDeuda, miCuota } from "@/modulos/aportes/aplicacion/deuda";
import {
  comprobantesPorRevisar,
  constanciaDePago,
  datosParaPagar,
  misPagos,
  registrarPagoDigital,
} from "@/modulos/aportes/aplicacion/pagos";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const LUNES_7 = new Date("2026-09-07T15:00:00Z");
const LUNES_14 = new Date("2026-09-14T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const ENVIO = new Date("2026-09-22T15:18:00Z");

let carmen: SesionDto;
let julio: SesionDto;
let marta: SesionDto;
let pedro: SesionDto;
let tokenMarta: string;

const sesionDe = async (dni: string): Promise<SesionDto> => {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
};

const foto = (sesion: SesionDto, uso = "comprobante_pago") =>
  prisma.archivo
    .create({
      data: {
        clave: `comprobantes/${randomUUID()}.jpg`,
        tipo: "image/jpeg",
        tamano: 1000,
        uso,
        subidoPor: sesion.usuarioId,
      },
    })
    .then((a) => a.id);

const pagar = async (
  sesion: SesionDto,
  cambios: Partial<Parameters<typeof registrarPagoDigital>[1]> = {},
  ahora = ENVIO,
) =>
  registrarPagoDigital(
    sesion,
    {
      semanas: 3,
      medio: "YAPE_O_PLIN",
      archivoId: await foto(sesion),
      idOperacion: randomUUID(),
      ...cambios,
    },
    ahora,
  );

beforeAll(() => {
  process.env.DATOS_PAGO_YAPE = "987 654 321, a nombre de Junta Vecinal";
  process.env.DATOS_PAGO_CUENTA = "191-2345678-0-12";
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas CASCADE`;
  await sembrar("clave-de-prueba");
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  marta = await sesionDe("40000002");
  pedro = await sesionDe("40000003");
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  for (const lunes of [LUNES_7, LUNES_14, LUNES_21]) await calcularDeuda(lunes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-COB-08 CA1 Datos para pagar y validación del comprobante", () => {
  it("@HU-COB-08 CA1 ofrece cuánto pagar, cómo y a dónde, y cuántas semanas hay pendientes", async () => {
    const datos = await datosParaPagar(carmen);
    expect(datos.opciones.map((o) => [o.titulo, o.monto, o.detalle])).toEqual([
      ["Todo lo pendiente", 1500, "3 semanas, del 7 al 27 de setiembre"],
      ["2 semanas", 1000, "Del 7 al 20 de setiembre"],
      ["1 semana", 500, "Del 7 al 13 de setiembre"],
    ]);
    expect(datos.medios).toEqual([
      { valor: "YAPE_O_PLIN", etiqueta: "Yape o Plin" },
      { valor: "TRANSFERENCIA", etiqueta: "Transferencia bancaria" },
      // La tercera, sin foto, la cobra la directiva en la casa (HU-COB-11).
      { valor: "EFECTIVO_EN_CASA", etiqueta: "En efectivo: que la directiva venga a mi casa" },
    ]);
    expect(datos.datosDePago).toEqual({
      yape: "987 654 321, a nombre de Junta Vecinal",
      cuenta: "191-2345678-0-12",
    });
    expect(datos.vivienda).toBe("Mz. C, lote 7");
  });

  it("@HU-COB-08 CA1 el comprobante tiene que ser un archivo que esa persona subió para eso", async () => {
    const ajeno = await foto(julio);
    const equivocado = await foto(carmen, "evidencia_queja");
    for (const archivoId of ["", randomUUID(), ajeno, equivocado]) {
      const error = await pagar(carmen, { archivoId }).catch((e) => e);
      expect(error).toBeInstanceOf(ErrorValidacion);
      expect(error.campos.archivoId).toBe(
        "Falta la foto de su comprobante, o pesa más de 5 MB. Suba una captura de pantalla; si no puede, pida ayuda a una persona.",
      );
    }
    expect(await prisma.pago.count()).toBe(0);
  });

  it("@HU-COB-08 CA1 el medio y la cantidad de semanas tienen que ser de las que se ofrecen", async () => {
    expect((await pagar(carmen, { medio: "EFECTIVO" as never }).catch((e) => e)).campos.medio).toBe(
      "Elija cómo va a pagar.",
    );
    expect((await pagar(carmen, { semanas: 0 }).catch((e) => e)).campos.semanas).toBe(
      "Elija cuánto va a pagar.",
    );
    expect((await pagar(carmen, { semanas: 4 }).catch((e) => e)).campos.semanas).toBe(
      "Elija cuánto va a pagar.",
    );
    expect(await prisma.pago.count()).toBe(0);
  });

  it("@HU-COB-08 CA1 quien no vive en una casa, o no es vecino, no puede pagar", async () => {
    await expect(pagar(pedro)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    const admin = await sesionDe("40000001");
    await expect(pagar(admin)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });
});

describe("@HU-COB-08 CA2 El pago queda en revisión", () => {
  it("@HU-COB-08 CA2 se registra con su constancia, su comprobante pendiente de revisión y las semanas que cubre", async () => {
    const { pago, creado } = await pagar(carmen, { semanas: 2, medio: "TRANSFERENCIA" });
    expect(creado).toBe(true);
    expect(pago).toMatchObject({
      constancia: expect.stringMatching(/^E-\d{4,}$/),
      monto: 1000,
      semanas: "2 semanas, del 7 al 20 de setiembre",
      medio: "Transferencia bancaria",
      estado: "En revisión",
    });
    const fila = await prisma.pago.findFirstOrThrow({ include: { cuotas: true, comprobantes: true } });
    expect(fila).toMatchObject({ estado: "REGISTRADO", monto: 1000, medio: "TRANSFERENCIA" });
    expect(fila.cuotas.map((c) => c.monto)).toEqual([500, 500]);
    expect(fila.comprobantes).toEqual([expect.objectContaining({ estado: "PENDIENTE_REVISION" })]);
    // Todavía no cambia ninguna cuota: lo hace la directiva al aprobarlo (HU-COB-09).
    const cuotas = await prisma.cuota.findMany({ where: { predioId: fila.predioId } });
    expect(cuotas.map((c) => [c.saldoPendiente, c.estado === "PAGADA"])).toEqual([
      [500, false],
      [500, false],
      [500, false],
    ]);
  });

  it("@HU-COB-08 CA2 Mi cuota muestra «Pago en revisión» en las semanas que cubre y sigue mostrando lo que debe", async () => {
    await pagar(carmen, { semanas: 2 });
    const cuota = (await miCuota(carmen))!;
    expect(cuota.debe).toBe(1500);
    expect(cuota.semanas.map((s) => s.estado)).toEqual(["Pago en revisión", "Pago en revisión", "Pendiente"]);
    expect(cuota.enRevision).toMatchObject({ monto: 1000 });
    expect(cuota.puedePagar).toBe(true);
    await pagar(carmen, { semanas: 1 });
    const completo = (await miCuota(carmen))!;
    expect(completo.enRevision?.monto).toBe(1500);
    expect(completo.puedePagar).toBe(false);
  });

  it("@HU-COB-08 CA2 las semanas que ya están en un pago no se pueden pagar otra vez", async () => {
    await pagar(carmen, { semanas: 2 });
    const [una] = (await datosParaPagar(carmen)).opciones;
    expect(una).toMatchObject({
      titulo: "Todo lo pendiente",
      monto: 500,
      detalle: "1 semana, del 21 al 27 de setiembre",
    });
    expect((await pagar(carmen, { semanas: 2 }).catch((e) => e)).campos.semanas).toBe(
      "Elija cuánto va a pagar.",
    );
    await pagar(carmen, { semanas: 1 });
    expect((await datosParaPagar(carmen)).opciones).toEqual([]);
  });

  it("@HU-COB-08 AC-5 repetir el envío no registra dos pagos ni avisa dos veces", async () => {
    const datos = {
      semanas: 3,
      medio: "YAPE_O_PLIN" as const,
      archivoId: await foto(carmen),
      idOperacion: randomUUID(),
    };
    const primero = await registrarPagoDigital(carmen, datos, ENVIO);
    const segundo = await registrarPagoDigital(carmen, datos, ENVIO);
    expect(segundo.creado).toBe(false);
    expect(segundo.pago.constancia).toBe(primero.pago.constancia);
    expect(await prisma.pago.count()).toBe(1);
    expect(await prisma.avisoEnCola.count({ where: { titulo: { contains: "comprobante" } } })).toBe(2);
  });

  it("@HU-COB-08 AC-7 otra persona no puede reusar el identificador de un pago ajeno", async () => {
    const datos = {
      semanas: 1,
      medio: "YAPE_O_PLIN" as const,
      archivoId: await foto(carmen),
      idOperacion: randomUUID(),
    };
    await registrarPagoDigital(carmen, datos, ENVIO);
    await expect(
      registrarPagoDigital(julio, { ...datos, archivoId: await foto(julio) }, ENVIO),
    ).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });
});

describe("@HU-COB-08 CA3 Aviso inmediato a la directiva", () => {
  it("@HU-COB-08 CA3 la directiva y los mediadores reciben el aviso con la casa y el monto, junto con la auditoría", async () => {
    const { pago } = await pagar(carmen);
    const avisos = await prisma.avisoEnCola.findMany({ where: { titulo: { contains: "comprobante" } } });
    expect(avisos.map((a) => a.destinatarioId).sort()).toEqual([marta.usuarioId, pedro.usuarioId].sort());
    expect(avisos[0]).toMatchObject({
      tipo: "PAGOS",
      titulo: "Llegó un comprobante de pago",
      texto: "Mz. C, lote 7 mandó su pago de S/ 15.00 por Yape o Plin. Revíselo en Cobros.",
    });
    const fila = await prisma.pago.findFirstOrThrow();
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "registrar_pago_digital", entidadId: fila.id },
    });
    expect(auditoria).toMatchObject({
      actorId: carmen.usuarioId,
      despues: { constancia: pago.constancia, monto: "S/ 15.00", medio: "Yape o Plin" },
    });
  });

  it("@HU-COB-08 CA3 el comprobante de una casa no le llega a otra casa ni a otros vecinos", async () => {
    await pagar(carmen);
    const julioAvisos = await prisma.avisoEnCola.count({
      where: { destinatarioId: julio.usuarioId, titulo: { contains: "comprobante" } },
    });
    expect(julioAvisos).toBe(0);
  });
});

describe("@HU-COB-08 Constancia de envío y Mis pagos", () => {
  it("@HU-COB-08 la casa descarga su constancia de envío en PDF; otra casa no puede (AC-7)", async () => {
    const { pago } = await pagar(carmen);
    const { pdf, nombreArchivo } = await constanciaDePago(carmen, pago.id);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(nombreArchivo).toBe(`constancia-${pago.constancia}.pdf`);
    await expect(constanciaDePago(julio, pago.id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(constanciaDePago(carmen, randomUUID())).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-08 Mis pagos lista el pago con su fecha, su medio y su estado, y solo los de la casa", async () => {
    await pagar(carmen, { semanas: 2 });
    await pagar(julio, { semanas: 1 });
    const { pagos } = await misPagos(carmen);
    expect(pagos).toEqual([
      expect.objectContaining({
        titulo: "Pago del 22 de setiembre",
        monto: 1000,
        detalle: "22 de setiembre de 2026 · Yape o Plin",
        estado: "En revisión",
        constancia: expect.stringMatching(/^E-/),
      }),
    ]);
  });

  it("@HU-COB-08 el pago nuevo aparece al instante en Mis pagos y recibos (HU-COB-02 CA3)", async () => {
    expect((await misPagos(carmen)).pagos).toEqual([]);
    await pagar(carmen);
    expect((await misPagos(carmen)).pagos).toHaveLength(1);
  });
});

describe("@HU-COB-08 DIR-COB-01 Cobros: comprobantes por revisar", () => {
  it("@HU-COB-08 la directiva ve los comprobantes por revisar, el más reciente primero, con lo que debía la casa", async () => {
    await pagar(carmen, { semanas: 1 }, new Date("2026-09-22T14:00:00Z"));
    await pagar(julio, { semanas: 3, medio: "TRANSFERENCIA" }, new Date("2026-09-23T14:00:00Z"));
    const { items } = await comprobantesPorRevisar(pedro);
    expect(items.map((i) => i.nombre)).toEqual(["Julio Mendoza", "Carmen Huamán"]);
    expect(items[0]).toMatchObject({
      medio: "Transferencia bancaria",
      vivienda: "Mz. A, lote 3",
      debia: 1350,
      monto: 1350,
      etiqueta: "Por revisar",
      esSuyo: false,
    });
    // Carmen pagó una semana de las tres que debe: pago parcial.
    expect(items[1]).toMatchObject({ debia: 1500, monto: 500, etiqueta: "Pago parcial" });
  });

  it("@HU-COB-08 el pago de quien revisa se marca para que lo revise otro miembro", async () => {
    await pagar(marta, { semanas: 1 });
    await pagar(carmen, { semanas: 1 });
    const { items } = await comprobantesPorRevisar(marta);
    expect(items.find((i) => i.nombre === "Marta Rojas")?.esSuyo).toBe(true);
    expect(items.find((i) => i.nombre === "Carmen Huamán")?.esSuyo).toBe(false);
  });

  it("@HU-COB-08 solo la directiva y los mediadores ven la bandeja; el vecino no", async () => {
    await expect(comprobantesPorRevisar(carmen)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });
});

describe("@HU-COB-08 Endpoints", () => {
  const pedir = (ruta: string, token: string | null, cuerpo?: unknown) =>
    new Request(`http://localhost${ruta}`, {
      method: cuerpo === undefined ? "GET" : "POST",
      headers: token ? { cookie: `sesion=${token}` } : {},
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });

  it("@HU-COB-08 POST /api/aportes/pagos/digital registra el pago (201) y repetirlo devuelve el mismo (200)", async () => {
    const cuerpo = {
      semanas: 1,
      medio: "YAPE_O_PLIN",
      archivoId: await foto(marta),
      idOperacion: randomUUID(),
    };
    const primera = await pagarHttp(pedir("/api/aportes/pagos/digital", tokenMarta, cuerpo), undefined);
    expect(primera.status).toBe(201);
    const { id, constancia } = await primera.json();
    const repetida = await pagarHttp(pedir("/api/aportes/pagos/digital", tokenMarta, cuerpo), undefined);
    expect(repetida.status).toBe(200);
    expect((await repetida.json()).constancia).toBe(constancia);

    const pdf = await constanciaHttp(pedir(`/api/aportes/pagos/${id}/constancia`, tokenMarta), {
      params: Promise.resolve({ id }),
    });
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toBe("application/pdf");
    const sin = await constanciaHttp(pedir(`/api/aportes/pagos/${id}/constancia`, null), {
      params: Promise.resolve({ id }),
    });
    expect(sin.status).toBe(401);
  });

  it("@HU-COB-08 un envío incompleto responde 400 con el campo que falta", async () => {
    const respuesta = await pagarHttp(
      pedir("/api/aportes/pagos/digital", tokenMarta, {
        semanas: 1,
        medio: "YAPE_O_PLIN",
        archivoId: "",
        idOperacion: randomUUID(),
      }),
      undefined,
    );
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).campos.archivoId).toMatch(/Falta la foto de su comprobante/);
  });
});
