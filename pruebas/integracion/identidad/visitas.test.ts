import { POST as registrarHttp } from "@/app/api/garita/visitas/route";
import { DELETE as anularHttp } from "@/app/api/garita/visitas/[id]/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  actualizarEstadoMorosidad,
  anularVisita,
  MENSAJE_VISITAS_EN_PAUSA,
  misVisitas,
  registrarVisita,
  verVisita,
} from "@/modulos/identidad/aplicacion/visitas";
import { codigoDeVisita, normalizarPlaca } from "@/modulos/identidad/dominio/visita";

// Las 10:00 de Lima del lunes 5 de octubre de 2026.
const T0 = new Date("2026-10-05T15:00:00Z");
const horas = (h: number) => new Date(T0.getTime() + h * 3_600_000);
let marta: SesionDto;
let tokenMarta: string;

async function sesionDe(dni: string) {
  // Las semillas no dan clave a los vecinos: se les crea una para la prueba.
  const { sesion } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" });
  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { ...sesion, usuarioId: usuario.id, nombreCompleto: usuario.nombreCompleto };
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios CASCADE`;
  await sembrar("clave-de-prueba");
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({
    dni: "40000002",
    clave: "clave-de-prueba",
  }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-04 Pre-registrar visitas", () => {
  it("@HU-GAR-04 CA1 CA3 registra nombre, DNI, horario de 3 horas y placa, y queda en la lista de la garita", async () => {
    const visita = await registrarVisita(
      marta,
      { nombre: " Rosa Huamán ", dni: "41234567", desde: horas(5), conVehiculo: true, placa: "abc123" },
      T0,
    );
    expect(visita).toMatchObject({
      codigo: expect.stringMatching(/^V-\d{4}$/),
      nombre: "Rosa Huamán",
      cuando: "Lunes 5 de octubre, de 3:00 p. m. a 6:00 p. m.",
      vehiculo: "Auto ABC-123",
      vivienda: "Mz. A, lote 12",
    });
    const { programadas, puedeRegistrar } = await misVisitas(marta, horas(1));
    expect(puedeRegistrar).toBe(true);
    expect(programadas.map((v) => v.nombre)).toEqual(["Rosa Huamán"]);
    // Pasado su horario, sale de la lista.
    expect((await misVisitas(marta, horas(9))).programadas).toEqual([]);
  });

  it("@HU-GAR-04 CA2 un vecino con 8 semanas pendientes no puede registrar visitas", async () => {
    const julio = await sesionDe("40000006");
    expect((await misVisitas(julio, T0)).puedeRegistrar).toBe(false);
    await expect(
      registrarVisita(julio, { nombre: "Ana", desde: horas(1), conVehiculo: false }, T0),
    ).rejects.toEqual(new ErrorReglaNegocio(MENSAJE_VISITAS_EN_PAUSA));

    // M5 lo pasa a verde al ponerse al día.
    const a3 = await prisma.predio.findUniqueOrThrow({
      where: { manzana_lote: { manzana: "A", lote: "3" } },
    });
    await prisma.$transaction((tx) => actualizarEstadoMorosidad(a3.id, "VERDE", tx));
    await expect(
      registrarVisita(julio, { nombre: "Ana", desde: horas(1), conVehiculo: false }, T0),
    ).resolves.toBeDefined();
  });

  it("@HU-GAR-04 CA1 pide nombre y una hora que no haya pasado; por HTTP con la fecha y hora de Lima", async () => {
    await expect(
      registrarVisita(marta, { nombre: " ", desde: horas(-1), conVehiculo: false }, T0),
    ).rejects.toMatchObject({
      campos: {
        nombre: "Falta el nombre de la visita.",
        desde: "Esa hora ya pasó. Elija una hora desde ahora.",
      },
    });
    await expect(
      registrarVisita(marta, { nombre: "X", desde: horas(24 * 61), conVehiculo: false }, T0),
    ).rejects.toBeInstanceOf(ErrorValidacion);

    const manana = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(
      new Date(Date.now() + 24 * 3_600_000),
    );
    const respuesta = await registrarHttp(
      new Request("http://localhost/api/garita/visitas", {
        method: "POST",
        headers: { cookie: `sesion=${tokenMarta}` },
        body: JSON.stringify({
          nombre: "Pedro",
          fecha: manana,
          hora: "16:30",
          conVehiculo: false,
          dni: "",
        }),
      }),
      undefined,
    );
    expect(respuesta.status).toBe(201);
    const creada = await prisma.visita.findFirstOrThrow({ where: { nombre: "Pedro" } });
    expect(creada.desde.toISOString()).toBe(`${manana}T21:30:00.000Z`);
  });

  it("@HU-GAR-04 la placa se lee como en la garita y el código de la constancia", () => {
    expect(normalizarPlaca("cdf 220")).toBe("CDF-220");
    expect(normalizarPlaca("a1b 23c")).toBe("A1B-23C");
    expect(codigoDeVisita(311)).toBe("V-0311");
  });
});

describe("@HU-GAR-05 Anular visitas", () => {
  it("@HU-GAR-05 CA1 CA2 CA3 anula una visita programada y sale de la lista al instante", async () => {
    const { id } = await registrarVisita(marta, { nombre: "Rosa", desde: horas(2), conVehiculo: false }, T0);
    const respuesta = await anularHttp(
      new Request("http://localhost/api", { method: "DELETE", headers: { cookie: `sesion=${tokenMarta}` } }),
      { params: Promise.resolve({ id }) },
    );
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toMatchObject({ estado: "ANULADA" });
    expect((await misVisitas(marta, T0)).programadas).toEqual([]);
    await expect(anularVisita(marta, id, T0)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-GAR-05 AC-7 no se ve ni se anula la visita de otra casa", async () => {
    const { id } = await registrarVisita(marta, { nombre: "Rosa", desde: horas(2), conVehiculo: false }, T0);
    const elena = await sesionDe("40000008");
    await expect(verVisita(elena, id, T0)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(anularVisita(elena, id, T0)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    const ana = (await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" })).sesion;
    await expect(misVisitas(ana, T0)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });
});
