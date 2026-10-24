import { randomUUID } from "node:crypto";
import { PATCH as observarHttp } from "@/app/api/aportes/comprobantes/[id]/observar/route";
import { POST as otraFotoHttp } from "@/app/api/aportes/pagos/[id]/otra-foto/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorReglaNegocio,
  ErrorValidacion,
} from "@/compartido/errores";
import { calcularDeuda, miCuota } from "@/modulos/aportes/aplicacion/deuda";
import {
  aprobarComprobante,
  comprobantesPorRevisar,
  enviarOtraFoto,
  misPagos,
  observarComprobante,
  pagoParaOtraFoto,
  registrarPagoDigital,
  verComprobante,
} from "@/modulos/aportes/aplicacion/pagos";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

// Emitir las cuotas en cada prueba tarda más que los 5 s de siempre cuando la máquina va cargada o corre con cobertura.
jest.setTimeout(30_000);

const LUNES_7 = new Date("2026-09-07T15:00:00Z");
const LUNES_14 = new Date("2026-09-14T15:00:00Z");
const LUNES_21 = new Date("2026-09-21T15:00:00Z");
const ENVIO = new Date("2026-09-22T15:18:00Z");
const REVISION = new Date("2026-09-23T14:00:00Z");
const OTRA_FOTO = new Date("2026-09-24T16:00:00Z");

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

/** La casa manda su pago y devuelve el id del pago y el del comprobante que espera revisión. */
async function pagar(sesion: SesionDto, semanas: number) {
  const { pago } = await registrarPagoDigital(
    sesion,
    { semanas, medio: "YAPE_O_PLIN", archivoId: await foto(sesion), idOperacion: randomUUID() },
    ENVIO,
  );
  const comprobante = await prisma.comprobante.findFirstOrThrow({
    where: { pagoId: pago.id, estado: "PENDIENTE_REVISION" },
  });
  return { pagoId: pago.id, comprobanteId: comprobante.id };
}

const BORROSA = { motivo: "IMAGEN_BORROSA", nota: "" };

beforeAll(() => {
  process.env.DATOS_PAGO_YAPE = "987 654 321, a nombre de Junta Vecinal";
  process.env.DATOS_PAGO_CUENTA = "191-2345678-0-12";
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, aportes_comprobantes, aportes_pago_cuotas, aportes_pagos, aportes_cuota_conceptos, aportes_cuotas, aportes_conceptos_tarifa, aportes_tarifas CASCADE`;
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

describe("@HU-COB-10 CA1 Causales de observación", () => {
  it.each([
    ["MONTO_INSUFICIENTE", "", "MONTO_INSUFICIENTE", null],
    ["IMAGEN_BORROSA", "", "IMAGEN_BORROSA", null],
    ["FECHA_ERRONEA", "Falta el día", "FECHA_ERRONEA", "Falta el día"],
    ["OTRO", "Falta el nombre del titular", "OTRO", "Falta el nombre del titular"],
  ])("@HU-COB-10 CA1 la directiva observa con el motivo %s", async (motivo, nota, esperado, notaEsperada) => {
    const { comprobanteId } = await pagar(carmen, 3);
    const r = await observarComprobante(marta, comprobanteId, { motivo, nota });
    expect(r).toMatchObject({ aplicado: true, nombre: "Carmen Huamán", monto: 1500 });
    const comprobante = await prisma.comprobante.findUniqueOrThrow({ where: { id: comprobanteId } });
    expect(comprobante).toMatchObject({
      estado: "OBSERVADO",
      motivoObservacion: esperado,
      nota: notaEsperada,
    });
  });

  it("@HU-COB-10 CA1 hay que elegir un motivo de la lista; «otro motivo» pide la nota", async () => {
    const { comprobanteId } = await pagar(carmen, 3);
    await expect(observarComprobante(marta, comprobanteId, { motivo: "", nota: "" })).rejects.toMatchObject({
      campos: { motivo: "Elija por qué lo observa." },
    });
    await expect(
      observarComprobante(marta, comprobanteId, { motivo: "OTRO", nota: " " }),
    ).rejects.toBeInstanceOf(ErrorValidacion);
    expect((await prisma.pago.findFirstOrThrow()).estado).toBe("REGISTRADO");
  });
});

describe("@HU-COB-10 CA2 Observar avisa a la vecina", () => {
  it("@HU-COB-10 CA2 el pago pasa a observado, sale de la bandeja y no toca las cuotas ni la garita", async () => {
    const { comprobanteId } = await pagar(carmen, 3);
    const casa = await prisma.residencia.findFirstOrThrow({
      where: { usuarioId: carmen.usuarioId, fechaFin: null },
    });
    const cuotas = () =>
      prisma.cuota.findMany({ where: { predioId: casa.predioId }, orderBy: { periodo: "asc" } });
    const antes = await cuotas();
    await prisma.predio.update({ where: { id: casa.predioId }, data: { estadoGarita: "ROJO" } });
    expect((await comprobantesPorRevisar(marta)).items).toHaveLength(1);
    await observarComprobante(marta, comprobanteId, BORROSA);

    expect((await prisma.pago.findFirstOrThrow()).estado).toBe("OBSERVADO");
    expect((await comprobantesPorRevisar(marta)).items).toEqual([]);
    expect((await verComprobante(marta, comprobanteId)).estado).toBe("Observado");
    expect(await cuotas()).toEqual(antes);
    expect((await prisma.predio.findUniqueOrThrow({ where: { id: casa.predioId } })).estadoGarita).toBe(
      "ROJO",
    );
  });

  it("@HU-COB-10 CA2 la vecina recibe el motivo en llano y qué hacer", async () => {
    const { comprobanteId } = await pagar(carmen, 3);
    await observarComprobante(marta, comprobanteId, BORROSA);
    const avisos = await prisma.avisoEnCola.findMany({
      where: { destinatarioId: carmen.usuarioId, titulo: "Su pago quedó observado" },
    });
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({
      tipo: "PAGOS",
      texto:
        "Su pago de S/ 15.00 quedó observado. La directiva no pudo leer la foto. Solo necesitan una foto más clara, donde se vean el monto y la fecha. Lo encuentra en Mis pagos.",
    });
  });

  it("@HU-COB-10 CA2 la nota de la directiva llega a la vecina", async () => {
    const { comprobanteId } = await pagar(carmen, 1);
    await observarComprobante(marta, comprobanteId, { motivo: "OTRO", nota: "Falta el nombre del titular" });
    const aviso = await prisma.avisoEnCola.findFirstOrThrow({
      where: { destinatarioId: carmen.usuarioId, titulo: "Su pago quedó observado" },
    });
    expect(aviso.texto).toContain("Falta el nombre del titular. Envíe otra foto cuando pueda.");
  });

  it("@HU-COB-10 CA2 Mis pagos dice el motivo y deja enviar otra foto; Mi cuota marca la semana y deja pagar", async () => {
    const { pagoId, comprobanteId } = await pagar(carmen, 3);
    await observarComprobante(marta, comprobanteId, BORROSA);

    expect((await misPagos(carmen)).pagos[0]).toMatchObject({
      id: pagoId,
      estado: "Observado",
      motivo: "la foto se ve borrosa",
      puedeEnviarOtraFoto: true,
    });
    const cuota = (await miCuota(carmen))!;
    expect(cuota.semanas.map((s) => s.estado)).toEqual([
      "Pago observado",
      "Pago observado",
      "Pago observado",
    ]);
    expect(cuota).toMatchObject({ enRevision: null, puedePagar: true, debe: 1500 });
  });

  it("@HU-COB-10 CA2 el pago observado no reserva las semanas: la casa puede pagar de nuevo", async () => {
    const { comprobanteId } = await pagar(carmen, 3);
    await observarComprobante(marta, comprobanteId, { motivo: "MONTO_INSUFICIENTE", nota: "" });
    const { pago } = await registrarPagoDigital(
      carmen,
      { semanas: 3, medio: "TRANSFERENCIA", archivoId: await foto(carmen), idOperacion: randomUUID() },
      OTRA_FOTO,
    );
    expect(pago.estado).toBe("En revisión");
    expect((await miCuota(carmen))!.semanas.map((s) => s.estado)).toEqual([
      "Pago en revisión",
      "Pago en revisión",
      "Pago en revisión",
    ]);
  });

  it("@HU-COB-10 AC-6 observar queda en la auditoría con quién lo hizo y el motivo", async () => {
    const { pagoId, comprobanteId } = await pagar(carmen, 3);
    await observarComprobante(marta, comprobanteId, BORROSA);
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "observar_pago", entidadId: pagoId },
    });
    expect(auditoria).toMatchObject({
      actorId: marta.usuarioId,
      despues: { monto: "S/ 15.00", motivo: "La imagen se ve borrosa" },
    });
  });

  it("@HU-COB-10 AC-5 observar dos veces no avisa ni audita dos veces", async () => {
    const { pagoId, comprobanteId } = await pagar(carmen, 3);
    await observarComprobante(marta, comprobanteId, BORROSA);
    const otra = await observarComprobante(marta, comprobanteId, BORROSA);
    expect(otra.aplicado).toBe(false);
    expect(await prisma.avisoEnCola.count({ where: { titulo: "Su pago quedó observado" } })).toBe(1);
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "observar_pago", entidadId: pagoId } }),
    ).toBe(1);
  });

  it("@HU-COB-10 solo la directiva observa, no el pago de su propia casa y no uno ya revisado", async () => {
    const { comprobanteId } = await pagar(carmen, 3);
    await expect(observarComprobante(pedro, comprobanteId, BORROSA)).rejects.toBeInstanceOf(
      ErrorNoAutorizado,
    );
    await expect(observarComprobante(carmen, comprobanteId, BORROSA)).rejects.toBeInstanceOf(
      ErrorNoAutorizado,
    );
    await expect(observarComprobante(marta, randomUUID(), BORROSA)).rejects.toBeInstanceOf(ErrorNoEncontrado);

    const suyo = await pagar(marta, 1);
    await expect(observarComprobante(marta, suyo.comprobanteId, BORROSA)).rejects.toThrow(
      /lo revisa otro miembro/,
    );

    await aprobarComprobante(marta, comprobanteId, REVISION);
    await expect(observarComprobante(marta, comprobanteId, BORROSA)).rejects.toBeInstanceOf(
      ErrorReglaNegocio,
    );
  });

  it("@HU-COB-10 un pago observado no se aprueba sin una foto nueva", async () => {
    const { comprobanteId } = await pagar(carmen, 3);
    await observarComprobante(marta, comprobanteId, BORROSA);
    await expect(aprobarComprobante(marta, comprobanteId, REVISION)).rejects.toBeInstanceOf(
      ErrorReglaNegocio,
    );
  });
});

describe("@HU-COB-10 CA3 La vecina envía otra foto", () => {
  it("@HU-COB-10 CA3 «Enviar otra foto» dice qué pasó y qué foto hace falta", async () => {
    const { pagoId, comprobanteId } = await pagar(carmen, 1);
    await observarComprobante(marta, comprobanteId, BORROSA);
    expect(await pagoParaOtraFoto(carmen, pagoId)).toMatchObject({
      id: pagoId,
      resumen: "Su pago de S/ 5.00 del 22 de setiembre sigue guardado.",
      titulo: "La directiva no pudo leer la foto",
      texto: "Solo necesitan una foto más clara, donde se vean el monto y la fecha.",
      puedeEnviar: true,
    });
  });

  it("@HU-COB-10 CA3 con la foto nueva el pago vuelve a revisión, se avisa a la directiva y se puede aprobar", async () => {
    const { pagoId, comprobanteId } = await pagar(carmen, 3);
    await observarComprobante(marta, comprobanteId, BORROSA);

    const archivoId = await foto(carmen);
    const r = await enviarOtraFoto(carmen, pagoId, { archivoId }, OTRA_FOTO);
    expect(r).toMatchObject({ aplicado: true, pago: { id: pagoId, estado: "En revisión" } });

    const comprobantes = await prisma.comprobante.findMany({
      where: { pagoId },
      orderBy: { creadoEn: "asc" },
    });
    expect(comprobantes.map((c) => c.estado)).toEqual(["OBSERVADO", "PENDIENTE_REVISION"]);
    expect(comprobantes[1].archivoId).toBe(archivoId);

    const { items } = await comprobantesPorRevisar(marta);
    expect(items).toHaveLength(1);
    expect(items[0].comprobanteId).toBe(comprobantes[1].id);
    expect((await miCuota(carmen))!.semanas.map((s) => s.estado)).toEqual([
      "Pago en revisión",
      "Pago en revisión",
      "Pago en revisión",
    ]);
    expect((await misPagos(carmen)).pagos[0]).toMatchObject({
      estado: "En revisión",
      puedeEnviarOtraFoto: false,
    });

    const avisos = await prisma.avisoEnCola.findMany({ where: { titulo: "Llegó otra foto de un pago" } });
    expect(avisos.map((a) => a.destinatarioId).sort()).toContain(marta.usuarioId);
    expect(avisos[0].texto).toBe("Mz. C, lote 7 mandó otra foto de su pago de S/ 15.00. Revísela en Cobros.");

    await aprobarComprobante(marta, comprobantes[1].id, REVISION);
    expect(await miCuota(carmen)).toMatchObject({ debe: 0, semanas: [] });
    expect((await prisma.pago.findUniqueOrThrow({ where: { id: pagoId } })).estado).toBe("APROBADO");
  });

  it("@HU-COB-10 CA3 la vecina puede subsanar con la diferencia: el pago observado sigue guardado", async () => {
    const { pagoId, comprobanteId } = await pagar(carmen, 1);
    await observarComprobante(marta, comprobanteId, { motivo: "MONTO_INSUFICIENTE", nota: "" });
    // Paga las dos semanas que faltan; el pago observado no se pierde ni se cuenta dos veces.
    const { pago } = await registrarPagoDigital(
      carmen,
      { semanas: 3, medio: "YAPE_O_PLIN", archivoId: await foto(carmen), idOperacion: randomUUID() },
      OTRA_FOTO,
    );
    expect(pago.monto).toBe(1500);
    expect((await prisma.pago.findUniqueOrThrow({ where: { id: pagoId } })).estado).toBe("OBSERVADO");
  });

  it("@HU-COB-10 AC-5 mandar la misma foto dos veces no avisa ni cambia nada otra vez", async () => {
    const { pagoId, comprobanteId } = await pagar(carmen, 3);
    await observarComprobante(marta, comprobanteId, BORROSA);
    const archivoId = await foto(carmen);
    await enviarOtraFoto(carmen, pagoId, { archivoId }, OTRA_FOTO);
    const avisos = () => prisma.avisoEnCola.count({ where: { titulo: "Llegó otra foto de un pago" } });
    const antes = await avisos();
    const otra = await enviarOtraFoto(carmen, pagoId, { archivoId }, OTRA_FOTO);
    expect(otra.aplicado).toBe(false);
    expect(await prisma.comprobante.count({ where: { pagoId } })).toBe(2);
    expect(await avisos()).toBe(antes);
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "reenviar_comprobante", entidadId: pagoId } }),
    ).toBe(1);
  });

  it("@HU-COB-10 AC-7 otra casa no ve ni toca el pago: responde como si no existiera", async () => {
    const { pagoId, comprobanteId } = await pagar(carmen, 3);
    await observarComprobante(marta, comprobanteId, BORROSA);
    await expect(pagoParaOtraFoto(julio, pagoId)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(
      enviarOtraFoto(julio, pagoId, { archivoId: await foto(julio) }, OTRA_FOTO),
    ).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-COB-10 CA3 solo se envía otra foto de un pago observado, con una foto propia y de semanas que sigan libres", async () => {
    const { pagoId, comprobanteId } = await pagar(carmen, 3);
    await expect(
      enviarOtraFoto(carmen, pagoId, { archivoId: await foto(carmen) }, OTRA_FOTO),
    ).rejects.toBeInstanceOf(ErrorReglaNegocio);

    await observarComprobante(marta, comprobanteId, BORROSA);
    await expect(enviarOtraFoto(carmen, pagoId, { archivoId: "" }, OTRA_FOTO)).rejects.toMatchObject({
      campos: { archivoId: expect.stringContaining("Falta la foto") },
    });
    await expect(
      enviarOtraFoto(carmen, pagoId, { archivoId: await foto(julio) }, OTRA_FOTO),
    ).rejects.toBeInstanceOf(ErrorValidacion);

    // Pagó las mismas semanas con un pago nuevo: el observado ya no puede volver a revisión.
    await registrarPagoDigital(
      carmen,
      { semanas: 3, medio: "YAPE_O_PLIN", archivoId: await foto(carmen), idOperacion: randomUUID() },
      OTRA_FOTO,
    );
    await expect(
      enviarOtraFoto(carmen, pagoId, { archivoId: await foto(carmen) }, OTRA_FOTO),
    ).rejects.toThrow(/ya están en un pago/);
  });
});

describe("@HU-COB-10 Endpoints", () => {
  const observar = (id: string, token: string | null, cuerpo: unknown) =>
    observarHttp(
      new Request(`http://localhost/api/aportes/comprobantes/${id}/observar`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...(token ? { cookie: `sesion=${token}` } : {}) },
        body: JSON.stringify(cuerpo),
      }),
      { params: Promise.resolve({ id }) },
    );

  it("@HU-COB-10 PATCH /api/aportes/comprobantes/{id}/observar observa (200) y repetirlo no avisa otra vez", async () => {
    const { comprobanteId } = await pagar(carmen, 3);
    const r = await observar(comprobanteId, tokenMarta, BORROSA);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ aplicado: true, nombre: "Carmen Huamán" });
    expect((await (await observar(comprobanteId, tokenMarta, BORROSA)).json()).aplicado).toBe(false);
  });

  it("@HU-COB-10 sin motivo responde 400, sin sesión 401 y sin ser directiva 403", async () => {
    const { comprobanteId } = await pagar(carmen, 3);
    const sinMotivo = await observar(comprobanteId, tokenMarta, { motivo: "", nota: "" });
    expect(sinMotivo.status).toBe(400);
    expect((await sinMotivo.json()).campos.motivo).toBe("Elija por qué lo observa.");
    expect((await observar(comprobanteId, null, BORROSA)).status).toBe(401);
    expect((await observar(comprobanteId, tokenAna, BORROSA)).status).toBe(403);
  });

  it("@HU-COB-10 POST /api/aportes/pagos/{id}/otra-foto devuelve el pago a revisión (200); sin sesión 401 y sin ser vecino 403", async () => {
    // Marta paga desde su casa; otra directiva lo habría observado: aquí se deja el pago ya observado.
    const { pagoId, comprobanteId } = await pagar(marta, 1);
    await prisma.pago.update({ where: { id: pagoId }, data: { estado: "OBSERVADO" } });
    await prisma.comprobante.update({
      where: { id: comprobanteId },
      data: { estado: "OBSERVADO", motivoObservacion: "IMAGEN_BORROSA" },
    });
    const enviar = (token: string | null, archivoId: string) =>
      otraFotoHttp(
        new Request(`http://localhost/api/aportes/pagos/${pagoId}/otra-foto`, {
          method: "POST",
          headers: { "content-type": "application/json", ...(token ? { cookie: `sesion=${token}` } : {}) },
          body: JSON.stringify({ archivoId }),
        }),
        { params: Promise.resolve({ id: pagoId }) },
      );
    expect((await enviar(null, "x")).status).toBe(401);
    expect((await enviar(tokenAna, "x")).status).toBe(403);
    const r = await enviar(tokenMarta, await foto(marta));
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ aplicado: true, pago: { estado: "En revisión" } });
  });
});
