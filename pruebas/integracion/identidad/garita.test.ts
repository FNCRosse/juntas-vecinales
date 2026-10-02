import { GET as consultaHttp } from "@/app/api/garita/consulta/route";
import { POST as accesosHttp } from "@/app/api/garita/accesos/route";
import { POST as preguntarHttp } from "@/app/api/garita/visitas/preguntas/route";
import { PATCH as responderHttp } from "@/app/api/garita/visitas/[id]/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  ErrorConflicto,
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorReglaNegocio,
  ErrorValidacion,
} from "@/compartido/errores";
import {
  abrirPorEmergencia,
  anotarEntradaVecino,
  anotarEntradaVisita,
  anotarNoEntro,
  bitacora,
  buscarCasas,
  consultar,
  hashDeDni,
  instantanea,
  marcarRespuestaTelefono,
  marcarSalida,
  preguntarAlVecino,
  registrarLlegada,
  responderVisita,
  verificarVisita,
  verVisitaEnGarita,
  visitaPorResponder,
  visitasDeHoy,
} from "@/modulos/identidad/aplicacion/garita";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { registrarVisita } from "@/modulos/identidad/aplicacion/visitas";
import { clasificarBusqueda, llegaAHora, llevaDemasiado } from "@/modulos/identidad/dominio/garita";

// La bitácora no se puede vaciar (es de solo inserción), así que cada prueba busca sus propias filas.
// Las 10:00 de Lima del martes 6 de octubre de 2026.
const T0 = new Date("2026-10-06T15:00:00Z");
const horas = (h: number) => new Date(T0.getTime() + h * 3_600_000);
let luis: SesionDto;
let tokenLuis: string;
let marta: SesionDto;

async function vecino(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

async function predio(manzana: string, lote: string) {
  return prisma.predio.findUniqueOrThrow({ where: { manzana_lote: { manzana, lote } } });
}

const avisosDe = (usuarioId: string) =>
  prisma.avisoEnCola.findMany({ where: { destinatarioId: usuarioId }, orderBy: { creadoEn: "asc" } });

const pedir = (ruta: string, metodo: string, token: string, cuerpo?: unknown) =>
  new Request(`http://localhost${ruta}`, {
    method: metodo,
    headers: { cookie: `sesion=${token}` },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos CASCADE`;
  await sembrar("clave-de-prueba");
  ({ sesion: luis, token: tokenLuis } = await iniciarSesionConClave({
    dni: "40000004",
    clave: "clave-de-prueba",
  }));
  ({ sesion: marta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-06 Consultar placas o DNI con el semáforo", () => {
  it("@HU-GAR-06 lee placa, DNI o nombre como los escribe el vigilante", () => {
    expect(clasificarBusqueda("cdf 220")).toEqual({ placa: "CDF-220" });
    expect(clasificarBusqueda("08123478")).toEqual({ dni: "08123478" });
    expect(clasificarBusqueda("Mz. C")).toEqual({ nombre: "Mz. C" });
    expect(clasificarBusqueda(" ")).toBeNull();
  });

  it("@HU-GAR-06 CA1 placa de un vecino al día: verde, abre la reja y queda en la bitácora", async () => {
    const respuesta = await consultaHttp(
      pedir("/api/garita/consulta?texto=cdf-220", "GET", tokenLuis),
      undefined,
    );
    expect(respuesta.status).toBe(200);
    const { resultados } = await respuesta.json();
    expect(resultados).toEqual([
      expect.objectContaining({
        vivienda: "Mz. B, lote 2",
        estado: "VERDE",
        quien: "Rosa Díaz",
        placa: "CDF-220",
      }),
    ]);

    const entrada = await accesosHttp(
      pedir("/api/garita/accesos", "POST", tokenLuis, {
        accion: "entrada_vecino",
        predioId: resultados[0].predioId,
        quien: "Rosa Díaz",
        placa: "CDF-220",
      }),
      undefined,
    );
    expect(entrada.status).toBe(201);
    const fila = await entrada.json();
    expect(fila).toMatchObject({
      modo: "VECINO_REJA",
      descripcion: "Vecino · reja abierta por el vigilante",
    });
    const rosa = await vecino("40000007");
    expect(await avisosDe(rosa.usuarioId)).toEqual([]);
  });

  it("@HU-GAR-06 CA2 CA3 casa en rojo: no se abre sola, entra a mano y se le avisa; nunca se ven montos", async () => {
    const { resultados } = await consultar(luis, "JLM314");
    expect(resultados).toEqual([expect.objectContaining({ estado: "ROJO", quien: "Julio Mendoza" })]);
    expect(JSON.stringify(resultados)).not.toMatch(/S\/|deuda|monto/i);

    const fila = await anotarEntradaVecino(
      luis,
      { predioId: resultados[0].predioId, quien: "Julio Mendoza", placa: "JLM-314" },
      T0,
    );
    expect(fila).toMatchObject({ modo: "VECINO_A_MANO", hora: "10:00 a. m.", vivienda: "Mz. A, lote 3" });
    const julio = await vecino("40000006");
    expect(await avisosDe(julio.usuarioId)).toEqual([
      expect.objectContaining({
        tipo: "SEGURIDAD",
        titulo: "Por ahora la reja no se abre sola",
        plantilla: "reja_manual",
        parametros: ["Julio", "10:00 a. m.", "Mz. A, lote 3"],
      }),
    ]);
  });

  it("@HU-GAR-06 por DNI o por nombre; quien ya no vive en el barrio no pasa como vecino", async () => {
    expect((await consultar(luis, "08123478")).resultados[0]).toMatchObject({
      vivienda: "Mz. C, lote 7",
      quien: "Carmen Huamán",
    });
    expect((await consultar(luis, "Mz. C")).resultados.map((r) => r.vivienda)).toEqual(["Mz. C, lote 7"]);
    expect((await consultar(luis, "elena")).resultados[0].placas).toEqual(["EDS-108", "ESM-021"]);
    expect(await consultar(luis, "99999999")).toEqual({ resultados: [], yaNoVive: null });

    const carmen = await vecino("08123478");
    await prisma.residencia.updateMany({ where: { usuarioId: carmen.usuarioId }, data: { fechaFin: T0 } });
    expect(await consultar(luis, "08123478")).toEqual({ resultados: [], yaNoVive: "Carmen Huamán" });
    await expect(consultar(luis, "x")).rejects.toBeInstanceOf(ErrorValidacion);
  });

  it("@HU-GAR-06 CA2 la apertura por emergencia queda en la bitácora y en la auditoría, y avisa a la directiva", async () => {
    const julio = await predio("A", "3");
    const fila = await abrirPorEmergencia(
      luis,
      { predioId: julio.id, quien: "Julio Mendoza", placa: "JLM-314", motivo: "SALUD" },
      T0,
    );
    expect(fila).toMatchObject({
      modo: "EMERGENCIA",
      descripcion: "Reja abierta por emergencia · Una emergencia de salud",
    });
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "abrir_por_emergencia", entidadId: fila.id } }),
    ).toBe(1);
    expect(await avisosDe(marta.usuarioId)).toEqual([
      expect.objectContaining({ tipo: "SEGURIDAD", plantilla: "emergencia_garita" }),
    ]);
  });

  it("@HU-GAR-06 AC-4 la lista guardada para consultar sin internet lleva los DNI solo como hash", async () => {
    const lista = await instantanea(luis, T0);
    expect(lista.generadaEn).toBe(T0.toISOString());
    const carmen = lista.casas.find((c) => c.vivienda === "Mz. C, lote 7");
    expect(carmen?.dnis).toEqual([hashDeDni("08123478")]);
    expect(JSON.stringify(lista)).not.toContain("08123478");
  });

  it("@HU-GAR-06 solo la garita consulta", async () => {
    await expect(consultar(await vecino("40000007"), "CDF-220")).rejects.toBeInstanceOf(ErrorNoAutorizado);
    const respuesta = await consultaHttp(
      new Request("http://localhost/api/garita/consulta?texto=x"),
      undefined,
    );
    expect(respuesta.status).toBe(401);
  });
});

describe("@HU-GAR-07 Verificar visitas contra la lista blanca", () => {
  it("@HU-GAR-07 CA1 la visita anunciada pasa, se anota y el vecino recibe el aviso", async () => {
    const visita = await registrarVisita(
      marta,
      { nombre: "Rosa Huamán", desde: horas(1), conVehiculo: true, placa: "ABC123" },
      T0,
    );
    expect(llegaAHora({ desde: horas(1), hasta: horas(4) }, horas(0.4))).toBe(false);
    await expect(registrarLlegada(luis, visita.id, horas(0.4))).rejects.toBeInstanceOf(ErrorReglaNegocio);

    expect((await verificarVisita(luis, "rosa h", horas(1))).map((v) => v.id)).toEqual([visita.id]);
    expect((await visitasDeHoy(luis, horas(1))).anunciadas[0]).toMatchObject({
      nombre: "Rosa Huamán",
      vivienda: "Mz. A, lote 12",
      vehiculo: "Auto ABC-123",
      llegaAHora: true,
    });

    const fila = await registrarLlegada(luis, visita.id, horas(1));
    expect(fila).toMatchObject({
      modo: "VISITA",
      quien: "Rosa Huamán",
      placa: "ABC-123",
      vivienda: "Mz. A, lote 12",
      descripcion: "Visita · Visita anunciada por Marta Rojas",
    });
    expect(await avisosDe(marta.usuarioId)).toEqual([
      expect.objectContaining({ tipo: "GARITA", titulo: "Rosa Huamán llegó", plantilla: "visita_llego" }),
    ]);
    await expect(registrarLlegada(luis, visita.id, horas(1))).rejects.toBeInstanceOf(ErrorConflicto);
    expect((await visitasDeHoy(luis, horas(1))).anunciadas).toEqual([]);
  });

  it("@HU-GAR-07 CA2 CA3 la no anunciada espera; la casa responde en la app y el vigilante anota la entrada", async () => {
    const carmenCasa = await predio("C", "7");
    expect((await buscarCasas(luis, "carmen")).map((c) => c.vivienda)).toEqual(["Mz. C, lote 7"]);

    const respuesta = await preguntarHttp(
      pedir("/api/garita/visitas/preguntas", "POST", tokenLuis, {
        nombre: "José Quispe",
        dni: "40000021",
        predioId: carmenCasa.id,
        motivo: "Viene a revisar el cable",
        conVehiculo: false,
      }),
      undefined,
    );
    expect(respuesta.status).toBe(201);
    const { id } = await respuesta.json();
    expect((await verVisitaEnGarita(luis, id)).estado).toBe("ESPERANDO_RESPUESTA");

    const carmen = await vecino("08123478");
    const [aviso] = await avisosDe(carmen.usuarioId);
    expect(aviso).toMatchObject({ tipo: "GARITA", titulo: "José Quispe está en la garita" });
    expect(aviso.parametros[2]).toMatch(new RegExp(`/visitas/${id}/responder$`));

    expect(await visitaPorResponder(carmen, id)).toMatchObject({
      nombre: "José Quispe",
      dni: "DNI terminado en 21",
      motivo: "Viene a revisar el cable",
      vehiculo: "A pie",
      anotadaPor: "Luis Paredes",
    });
    // AC-7: otra casa no la ve ni la responde.
    const rosa = await vecino("40000007");
    await expect(visitaPorResponder(rosa, id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    await expect(responderVisita(rosa, id, true)).rejects.toBeInstanceOf(ErrorNoEncontrado);

    await expect(anotarEntradaVisita(luis, id, T0)).rejects.toBeInstanceOf(ErrorConflicto);
    await responderVisita(carmen, id, true, T0);
    await expect(responderVisita(carmen, id, false, T0)).rejects.toBeInstanceOf(ErrorConflicto);
    expect((await verVisitaEnGarita(luis, id)).respondidaPor).toBe("Carmen Huamán, desde la app");

    const fila = await anotarEntradaVisita(luis, id, T0);
    expect(fila).toMatchObject({
      modo: "VISITA",
      quien: "José Quispe",
      descripcion: "Visita · Visita no anunciada · autorizó Carmen Huamán, desde la app",
    });
    expect((await prisma.visita.findUniqueOrThrow({ where: { id } })).estado).toBe("LLEGO");
  });

  it("@HU-GAR-07 CA3 si responde por teléfono que no, la visita no entra y queda anotado", async () => {
    const carmenCasa = await predio("C", "7");
    const { id } = await preguntarAlVecino(
      luis,
      { nombre: "Desconocido", predioId: carmenCasa.id, motivo: "Venta", conVehiculo: false },
      "http://localhost",
      T0,
    );
    const respuesta = await responderHttp(
      pedir(`/api/garita/visitas/${id}`, "PATCH", tokenLuis, { autoriza: false, via: "telefono" }),
      { params: Promise.resolve({ id }) },
    );
    expect(respuesta.status).toBe(204);
    await expect(anotarEntradaVisita(luis, id, T0)).rejects.toBeInstanceOf(ErrorConflicto);
    const fila = await anotarNoEntro(luis, id, T0);
    expect(fila).toMatchObject({ modo: "NO_ENTRO", descripcion: "No entró · La casa no la autorizó" });
    await expect(marcarRespuestaTelefono(luis, id, true)).rejects.toBeInstanceOf(ErrorConflicto);
    await expect(marcarSalida(luis, fila.id, T0)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });
});

describe("@HU-GAR-08 Bitácora de entradas y salidas", () => {
  it("@HU-GAR-08 CA1 CA2 guarda hora, placa, conductor y vivienda; alerta a las 6 horas y marca una sola salida", async () => {
    expect(llevaDemasiado(T0, horas(6))).toBe(false);
    expect(llevaDemasiado(T0, horas(6.1))).toBe(true);
    const visita = await registrarVisita(
      marta,
      { nombre: "Camión de mudanza", desde: T0, conVehiculo: true, placa: "LMN908" },
      T0,
    );
    const entrada = await registrarLlegada(luis, visita.id, T0);
    const rosa = await predio("B", "2");
    const deVecino = await anotarEntradaVecino(luis, { predioId: rosa.id, quien: "Rosa Díaz" }, T0);

    const tarde = await bitacora(luis, horas(7));
    const fila = tarde.filas.find((f) => f.id === entrada.id);
    expect(fila).toMatchObject({
      hora: "10:00 a. m.",
      placa: "LMN-908",
      quien: "Camión de mudanza",
      alerta: true,
    });
    // Los vecinos no generan la alerta de permanencia.
    expect(tarde.filas.find((f) => f.id === deVecino.id)?.alerta).toBe(false);
    expect(tarde.dentro.map((f) => f.id)).toEqual(expect.arrayContaining([entrada.id, deVecino.id]));

    const salida = await marcarSalida(luis, entrada.id, horas(7));
    expect(salida).toMatchObject({ salida: "5:00 p. m.", alerta: false });
    await marcarSalida(luis, entrada.id, horas(7));
    expect(await prisma.registroAcceso.count({ where: { entradaId: entrada.id } })).toBe(1);
    const despues = await bitacora(luis, horas(7));
    expect(despues.dentro.map((f) => f.id)).not.toContain(entrada.id);
    expect(despues.filas.find((f) => f.id === entrada.id)?.salida).toBe("5:00 p. m.");
  });

  it("@HU-GAR-08 CA3 la bitácora no se edita ni se borra", async () => {
    const rosa = await predio("B", "2");
    const fila = await anotarEntradaVecino(luis, { predioId: rosa.id, quien: "Rosa Díaz" }, T0);
    await expect(
      prisma.registroAcceso.update({ where: { id: fila.id }, data: { quien: "Otra persona" } }),
    ).rejects.toThrow();
    await expect(prisma.registroAcceso.delete({ where: { id: fila.id } })).rejects.toThrow();
    await expect(prisma.$executeRaw`TRUNCATE identidad_registros_acceso`).rejects.toThrow();
    expect((await prisma.registroAcceso.findUniqueOrThrow({ where: { id: fila.id } })).quien).toBe(
      "Rosa Díaz",
    );
  });
});
