import { POST as empadronarHttp } from "@/app/api/admin/padron/empadronar/route";
import { POST as validarHttp } from "@/app/api/admin/padron/validar/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { hashDeToken } from "@/compartido/claves";
import { despacharAvisos } from "@/compartido/notificaciones/despachar";
import { crearSimulador } from "@/compartido/notificaciones/whatsapp";
import { ErrorConflicto, ErrorNoAutorizado, ErrorValidacion } from "@/compartido/errores";
import {
  type DatosEmpadronamiento,
  empadronar,
  MENSAJE_YA_REGISTRADO,
} from "@/modulos/identidad/aplicacion/empadronar";
import { emitirEnlace } from "@/modulos/identidad/aplicacion/emitirEnlace";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

jest.mock("next/server", () => ({ after: jest.fn() }));

const CLAVE = "clave-de-prueba";
const T0 = new Date("2026-10-05T15:00:00Z");
const ORIGEN = "https://jv.ejemplo";

const datos = (cambios: Partial<DatosEmpadronamiento> = {}): DatosEmpadronamiento => ({
  vivienda: {
    manzana: " c ",
    lote: "15",
    uso: "VIVIENDA",
    familias: 1,
    inquilinos: 0,
    autos: 1,
    motos: 0,
    triciclos: 0,
    negocios: 0,
  },
  titular: { nombreCompleto: "Sofía Castro Ríos", dni: "45678123", dniVisto: true, telefono: "912345678" },
  otros: [
    {
      nombreCompleto: "Manuel Castro Ríos",
      dni: "45678999",
      dniVisto: true,
      relacion: "CONYUGE",
      cuentaPropia: true,
      telefono: "912345700",
    },
    {
      nombreCompleto: "Lucía Castro",
      dni: "71234567",
      dniVisto: true,
      relacion: "HIJO",
      cuentaPropia: false,
    },
  ],
  ...cambios,
});

let ana: SesionDto;
let tokenAna: string;

const pedir = (ruta: typeof empadronarHttp, cuerpo: unknown, token = tokenAna) =>
  ruta(
    new Request("http://localhost/api/admin/padron", {
      method: "POST",
      headers: { cookie: `sesion=${token}` },
      body: JSON.stringify(cuerpo),
    }),
    undefined,
  );

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones CASCADE`;
  await sembrar(CLAVE);
  ({ sesion: ana, token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: CLAVE }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-01 Empadronar residentes", () => {
  it("@HU-GAR-01 CA1 guarda el predio con su ocupación y a cada residente con su relación", async () => {
    const vivienda = await empadronar(ana, datos(), ORIGEN, T0);
    expect(vivienda).toMatchObject({ direccion: "Mz. C, lote 15", titular: "Sofía Castro Ríos" });

    const predio = await prisma.predio.findUniqueOrThrow({
      where: { id: vivienda.predioId },
      include: { residencias: { include: { usuario: true }, orderBy: { relacion: "asc" } } },
    });
    expect(predio).toMatchObject({ manzana: "C", lote: "15", uso: "VIVIENDA", familias: 1, autos: 1 });
    expect(
      predio.residencias.map((r) => [r.relacion, r.usuario.dni, r.usuario.telefonoWhatsApp, r.usuario.roles]),
    ).toEqual([
      ["TITULAR", "45678123", "51912345678", ["VECINO"]],
      ["CONYUGE", "45678999", "51912345700", ["VECINO"]],
      ["HIJO", "71234567", null, ["VECINO"]],
    ]);
  });

  it("@HU-GAR-01 CA2 emite un enlace de un solo uso por cuenta propia, que vence en 15 minutos, y lo encola a su WhatsApp", async () => {
    const vivienda = await empadronar(ana, datos(), ORIGEN, T0);
    expect(vivienda.enlacesEnviados).toEqual([
      { nombre: "Sofía Castro Ríos", relacion: "Titular", telefono: "912345678" },
      { nombre: "Manuel Castro Ríos", relacion: "Esposo o esposa", telefono: "912345700" },
    ]);

    const enlaces = await prisma.magicLink.findMany({ include: { usuario: true } });
    expect(enlaces.map((e) => e.usuario.dni).sort()).toEqual(["45678123", "45678999"]);
    for (const enlace of enlaces) {
      expect(enlace.expiraEn.getTime() - enlace.emitidoEn.getTime()).toBe(15 * 60_000);
      expect(enlace.usadoEn).toBeNull();
    }

    const avisos = await prisma.avisoEnCola.findMany({ orderBy: { telefono: "asc" } });
    expect(avisos.map((a) => [a.telefono, a.plantilla, a.parametros[0]])).toEqual([
      ["51912345678", "enlace_acceso", "Sofía"],
      ["51912345700", "enlace_acceso", "Manuel"],
    ]);
    // En la BD solo está el hash del token; el enlace viaja en la cola y la copia interna no lo lleva.
    const token = avisos[0].parametros[1].replace(`${ORIGEN}/entrar/`, "");
    expect(await prisma.magicLink.count({ where: { tokenHash: hashDeToken(token) } })).toBe(1);
    expect(await prisma.magicLink.count({ where: { tokenHash: token } })).toBe(0);
    expect(avisos[0].texto).not.toContain(token);

    // Al enviarse, el enlace deja de estar guardado en la cola.
    await despacharAvisos(T0, crearSimulador({}));
    expect((await prisma.avisoEnCola.findMany()).map((a) => [a.estado, a.parametros])).toEqual([
      ["ENVIADA", []],
      ["ENVIADA", []],
    ]);
    expect(await prisma.notificacion.count()).toBe(2);
  });

  it("@HU-GAR-01 CA2 un enlace nuevo anula el anterior de esa persona", async () => {
    await empadronar(ana, datos(), ORIGEN, T0);
    const sofia = await prisma.usuario.findUniqueOrThrow({ where: { dni: "45678123" } });
    await prisma.$transaction((tx) => emitirEnlace(tx, sofia, ORIGEN, new Date(T0.getTime() + 60_000)));
    const enlaces = await prisma.magicLink.findMany({
      where: { usuarioId: sofia.id },
      orderBy: { emitidoEn: "asc" },
    });
    expect(enlaces.map((e) => e.anuladoEn)).toEqual([new Date(T0.getTime() + 60_000), null]);
  });

  it("@HU-GAR-01 CA3 deja la auditoría con el administrador que hizo el alta, en la misma transacción", async () => {
    const vivienda = await empadronar(ana, datos(), ORIGEN, T0);
    const registro = await prisma.registroAuditoria.findFirstOrThrow({
      where: { entidadId: vivienda.predioId },
    });
    expect(registro).toMatchObject({ actorId: ana.usuarioId, accion: "empadronar", entidad: "Predio" });
    expect(registro.despues).toMatchObject({
      manzana: "C",
      residentes: [
        { relacion: "TITULAR", dniVerificadoEnFisico: true, enlaceEnviado: true },
        { relacion: "CONYUGE", enlaceEnviado: true },
        { relacion: "HIJO", enlaceEnviado: false },
      ],
    });
    expect(vivienda.registradoPor).toBe("Ana Flores");
  });

  it("@HU-GAR-01 CA3 bloquea un DNI que ya está en el padrón y dice dónde vive", async () => {
    const conDuplicado = datos({
      titular: { nombreCompleto: "Otra", dni: "40000006", dniVisto: true, telefono: "912345678" },
    });
    await expect(empadronar(ana, conDuplicado, ORIGEN, T0)).rejects.toMatchObject({
      campos: {
        "titular.dni":
          "Este DNI ya está en el padrón: Julio Mendoza, Mz. A, lote 3. Una persona no puede estar dos veces. Si se mudó, primero dele de baja en esa vivienda.",
      },
    });
    expect(await prisma.predio.count({ where: { lote: "15" } })).toBe(0);
    expect(await prisma.avisoEnCola.count()).toBe(0);
  });

  it("@HU-GAR-01 CA3 bloquea el DNI de una cuenta del equipo y un DNI repetido en la misma vivienda", async () => {
    const otros = datos().otros ?? [];
    const repetido = datos({
      titular: { nombreCompleto: "Luis", dni: "40000004", dniVisto: true, telefono: "912345678" },
      otros: [otros[0], { ...otros[1], dni: "45678999" }],
    });
    const error = await empadronar(ana, repetido, ORIGEN, T0).catch((e: ErrorValidacion) => e);
    expect(error).toBeInstanceOf(ErrorValidacion);
    expect((error as ErrorValidacion).campos).toEqual({
      "titular.dni": "Este DNI ya tiene una cuenta: Luis Paredes. Una persona no puede estar dos veces.",
      "otros.1.dni": "Este DNI ya está en esta vivienda. Revise los números.",
    });
  });

  it("@HU-GAR-01 CA1 exige ver el DNI físico, el lote libre y un WhatsApp propio por cuenta", async () => {
    const otros = datos().otros ?? [];
    const incompleto = datos({
      vivienda: { ...datos().vivienda, manzana: "C", lote: "7", familias: 0 },
      titular: { nombreCompleto: "Sofía", dni: "45678123", dniVisto: false },
      otros: [
        { ...otros[0], telefono: undefined },
        { ...otros[1], cuentaPropia: true, telefono: "912345678" },
      ],
    });
    const error = (await empadronar(ana, incompleto, ORIGEN, T0).catch((e) => e)) as ErrorValidacion;
    expect(error.campos).toEqual({
      "vivienda.lote":
        "Ese lote ya está en el padrón: es de Carmen Huamán. Si quiere agregar a alguien, hágalo desde su ficha.",
      "vivienda.familias": "Elija un número entre 1 y 9.",
      "titular.dniVisto": "Falta confirmar que vio el DNI. Pídale el documento y marque la casilla.",
      "titular.telefono": "Falta su WhatsApp (9 números). A ese número le enviaremos su enlace de entrada.",
      "otros.0.telefono":
        'Para enviarle su enlace hace falta su WhatsApp (9 números). Si no tiene, apague "Tendrá su propia cuenta".',
    });
  });

  it("@HU-GAR-01 CA3 si otra petición guardó el mismo lote mientras tanto, responde conflicto sin guardar nada", async () => {
    const original = prisma.$transaction.bind(prisma);
    const espia = jest.spyOn(prisma, "$transaction").mockImplementationOnce(async (...args: unknown[]) => {
      await prisma.predio.create({ data: { manzana: "C", lote: "15", uso: "VIVIENDA" } });
      return (original as (...a: unknown[]) => unknown)(...args);
    });
    await expect(empadronar(ana, datos(), ORIGEN, T0)).rejects.toEqual(
      new ErrorConflicto(MENSAJE_YA_REGISTRADO),
    );
    espia.mockRestore();
    expect(await prisma.usuario.count({ where: { dni: "45678123" } })).toBe(0);
  });

  it("@HU-GAR-01 solo el administrador empadrona", async () => {
    const { sesion: marta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE });
    await expect(empadronar(marta, datos(), ORIGEN, T0)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });
});

describe("@HU-GAR-01 Route handlers del padrón", () => {
  it("@HU-GAR-01 CA1 validar revisa un paso sin guardar nada", async () => {
    const soloVivienda = { vivienda: datos().vivienda };
    expect((await pedir(validarHttp, soloVivienda)).status).toBe(204);
    const ocupado = await pedir(validarHttp, { vivienda: { ...datos().vivienda, manzana: "a", lote: "3" } });
    expect(ocupado.status).toBe(400);
    expect((await ocupado.json()).campos["vivienda.lote"]).toMatch(
      /^Ese lote ya está en el padrón: es de Julio/,
    );
    expect(await prisma.predio.count({ where: { lote: "15" } })).toBe(0);
  });

  it("@HU-GAR-01 CA2 empadronar responde 201 con lo que se envió", async () => {
    const respuesta = await pedir(empadronarHttp, {
      ...datos(),
      titular: { ...datos().titular, telefono: "912 345 678" },
    });
    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toMatchObject({
      direccion: "Mz. C, lote 15",
      enlacesEnviados: expect.any(Array),
    });
    expect(
      (await prisma.avisoEnCola.findFirstOrThrow({ where: { telefono: "51912345678" } })).parametros[1],
    ).toMatch(/^http:\/\/localhost\/entrar\/[\w-]{43}$/);
  });

  it("@HU-GAR-01 los datos con forma incorrecta responden 400 con el mensaje de cada campo", async () => {
    const respuesta = await pedir(empadronarHttp, {
      vivienda: { ...datos().vivienda, uso: "OTRO" },
      titular: { nombreCompleto: " ", dni: "123", dniVisto: true, telefono: "12345" },
    });
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).campos).toEqual({
      "vivienda.uso": "Elija para qué se usa.",
      "titular.nombreCompleto": "Falta el nombre. Escríbalo como figura en su DNI.",
      "titular.dni": "El DNI tiene 8 números. Revise que estén todos.",
      "titular.telefono": "El WhatsApp tiene 9 números y empieza con 9. Revíselo.",
    });
  });

  it("@HU-GAR-01 sin sesión responde 401 y sin titular no empadrona", async () => {
    expect((await pedir(empadronarHttp, datos(), "otro")).status).toBe(401);
    const sinTitular = await pedir(empadronarHttp, { vivienda: datos().vivienda });
    expect(sinTitular.status).toBe(400);
  });
});
