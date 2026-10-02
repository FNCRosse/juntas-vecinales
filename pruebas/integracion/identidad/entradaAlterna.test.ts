import { POST as reenviarAdminHttp } from "@/app/api/admin/usuarios/[usuarioId]/enlace/route";
import { POST as claveHttp } from "@/app/api/auth/clave/route";
import { POST as confirmarHttp } from "@/app/api/auth/clave/restablecer/confirmar/route";
import { POST as restablecerHttp } from "@/app/api/auth/clave/restablecer/route";
import { POST as enlaceNuevoHttp } from "@/app/api/auth/magic-link/reenviar/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorConflicto, ErrorNoAutorizado } from "@/compartido/errores";
import { canjearEnlace, consultarEnlace } from "@/modulos/identidad/aplicacion/entrarConEnlace";
import {
  MENSAJE_MUY_SEGUIDO,
  pedirEnlace,
  restablecerClave,
} from "@/modulos/identidad/aplicacion/entradaAlterna";
import {
  iniciarSesionConClave,
  MENSAJE_EN_PAUSA,
} from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import { reenviarEnlace } from "@/modulos/identidad/aplicacion/reenviarEnlace";

jest.mock("next/server", () => ({ after: jest.fn() }));

const ORIGEN = "https://jv.ejemplo";
const T0 = new Date("2026-10-05T15:00:00Z");
const minutos = (m: number) => new Date(T0.getTime() + m * 60_000);
const CARMEN = "08123478";

const ultimoAviso = () => prisma.avisoEnCola.findFirstOrThrow({ orderBy: { creadoEn: "desc" } });
const tokenDe = async (ruta: string) => (await ultimoAviso()).parametros[1].replace(`${ORIGEN}${ruta}/`, "");
const pedir = (ruta: typeof claveHttp, cuerpo: unknown, cookie = "") =>
  ruta(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { cookie },
      body: JSON.stringify(cuerpo),
    }),
    undefined,
  );

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos CASCADE`;
  await sembrar("clave-de-prueba");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-11 Pedir un enlace nuevo", () => {
  it("@HU-GAR-11 CA1 CA3 con el DNI o con la casa, el enlace va solo al WhatsApp del padrón", async () => {
    await pedirEnlace(CARMEN, "ENTRADA", ORIGEN, T0);
    expect(await ultimoAviso()).toMatchObject({ telefono: "51900000005", plantilla: "enlace_acceso" });
    await pedirEnlace("Mz. A lote 3", "ENTRADA", ORIGEN, minutos(2));
    expect(await ultimoAviso()).toMatchObject({ telefono: "51900000006" });
    await expect(canjearEnlace(await tokenDe("/entrar"), undefined, minutos(3))).resolves.toMatchObject({
      sesion: { nombreCompleto: "Julio Mendoza" },
    });
  });

  it("@HU-GAR-11 CA2 el enlace anterior deja de servir antes de emitir el nuevo", async () => {
    await pedirEnlace(CARMEN, "ENTRADA", ORIGEN, T0);
    const anterior = await tokenDe("/entrar");
    await pedirEnlace(CARMEN, "ENTRADA", ORIGEN, minutos(2));
    expect(await consultarEnlace(anterior, minutos(3))).toEqual({ estado: "ANULADO" });
    expect(await consultarEnlace(await tokenDe("/entrar"), minutos(3))).toMatchObject({ estado: "VIGENTE" });
  });

  it("@HU-GAR-11 CA3 responde igual exista o no; solo envía al padrón, sin saturar el teléfono", async () => {
    const enviados = () => prisma.avisoEnCola.count();
    await pedirEnlace("99999999", "ENTRADA", ORIGEN, T0);
    await pedirEnlace("Z 1", "ENTRADA", ORIGEN, T0);
    await prisma.usuario.update({ where: { dni: CARMEN }, data: { telefonoWhatsApp: null } });
    await pedirEnlace(CARMEN, "ENTRADA", ORIGEN, T0);
    expect(await enviados()).toBe(0);

    await pedirEnlace("40000006", "ENTRADA", ORIGEN, T0);
    await pedirEnlace("40000006", "ENTRADA", ORIGEN, minutos(0.5));
    expect(await enviados()).toBe(1);
    for (let i = 1; i <= 4; i++) await pedirEnlace("40000006", "ENTRADA", ORIGEN, minutos(i * 2));
    await pedirEnlace("40000006", "ENTRADA", ORIGEN, minutos(12));
    expect(await enviados()).toBe(5);
    await pedirEnlace("40000006", "ENTRADA", ORIGEN, minutos(61));
    expect(await enviados()).toBe(6);
  });

  it("@HU-GAR-11 por HTTP: siempre 202, salvo 400 si no se entiende lo escrito", async () => {
    for (const identificador of [" c-7 ", "99999999"]) {
      const respuesta = await pedir(enlaceNuevoHttp, { identificador });
      expect(respuesta.status).toBe(202);
      expect(await respuesta.text()).toBe("");
    }
    const malo = await pedir(enlaceNuevoHttp, { identificador: "123" });
    expect(malo.status).toBe(400);
    expect((await malo.json()).campos).toEqual({
      identificador: "Escriba su DNI (8 números) o su casa, por ejemplo Mz. C lote 7.",
    });
  });

  it("@HU-GAR-11 la administración reenvía el enlace desde la ficha y queda auditado", async () => {
    const { sesion: ana, token } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" });
    const carmen = await prisma.usuario.findUniqueOrThrow({ where: { dni: CARMEN } });
    expect(await reenviarEnlace(ana, carmen.id, ORIGEN, T0)).toEqual({
      nombre: "Carmen Huamán",
      telefonoTerminadoEn: "005",
    });
    expect(
      await prisma.registroAuditoria.count({ where: { entidadId: carmen.id, accion: "reenviar_enlace" } }),
    ).toBeGreaterThan(0);
    await expect(reenviarEnlace(ana, carmen.id, ORIGEN, minutos(0.5))).rejects.toThrow(MENSAJE_MUY_SEGUIDO);
    const { sesion: luis } = await iniciarSesionConClave({ dni: "40000004", clave: "clave-de-prueba" });
    await expect(reenviarEnlace(luis, carmen.id, ORIGEN)).rejects.toBeInstanceOf(ErrorNoAutorizado);

    const respuesta = await reenviarAdminHttp(
      new Request("http://localhost/api", { method: "POST", headers: { cookie: `sesion=${token}` } }),
      { params: Promise.resolve({ usuarioId: "no-existe" }) },
    );
    expect(respuesta.status).toBe(404);
  });
});

describe("@HU-GAR-24 Entrar con la clave de respaldo", () => {
  async function conClave(clave = "mi-clave-1") {
    await pedirEnlace(CARMEN, "CLAVE", ORIGEN, T0);
    await restablecerClave(await tokenDe("/clave/nueva"), clave, undefined, minutos(1));
  }

  it("@HU-GAR-24 CA2 valida la clave vinculada al DNI antes de dar acceso", async () => {
    await conClave();
    const bien = await pedir(claveHttp, { dni: CARMEN, clave: "mi-clave-1" });
    expect(bien.status).toBe(200);
    expect(await bien.json()).toEqual({ destino: "/" });
    expect((await pedir(claveHttp, { dni: CARMEN, clave: "otra-clave" })).status).toBe(401);
  });

  it("@HU-GAR-24 CA3 tras cinco fallos seguidos pausa la entrada con clave y sugiere el enlace", async () => {
    await conClave();
    for (let i = 0; i < 4; i++) await pedir(claveHttp, { dni: CARMEN, clave: "otra-clave" });
    const pausa = await pedir(claveHttp, { dni: CARMEN, clave: "otra-clave" });
    expect(pausa.status).toBe(429);
    expect(await pausa.json()).toEqual({ error: MENSAJE_EN_PAUSA });
    // El enlace por WhatsApp sigue disponible durante la pausa.
    await pedirEnlace(CARMEN, "ENTRADA", ORIGEN, minutos(5));
    expect(await ultimoAviso()).toMatchObject({ telefono: "51900000005", plantilla: "enlace_acceso" });
  });
});

describe("@HU-GAR-25 Restablecer la clave de respaldo", () => {
  it("@HU-GAR-25 CA1 CA2 el enlace para la clave va solo al WhatsApp del padrón y no sirve para entrar", async () => {
    expect((await pedir(restablecerHttp, { identificador: "Mz. C lote 7" })).status).toBe(202);
    expect(await ultimoAviso()).toMatchObject({ telefono: "51900000005", plantilla: "clave_nueva" });
    const token = (await ultimoAviso()).parametros[1].replace("http://localhost/clave/nueva/", "");
    expect(await consultarEnlace(token, new Date(), "CLAVE")).toMatchObject({
      estado: "VIGENTE",
      nombre: "Carmen",
    });
    // Es un enlace para la clave: no inicia sesión por la entrada normal.
    expect(await consultarEnlace(token)).toEqual({ estado: "VENCIDO" });
    await expect(canjearEnlace(token, undefined)).rejects.toBeInstanceOf(ErrorConflicto);
  });

  it("@HU-GAR-25 CA3 la clave nueva reemplaza a la anterior, se avisa del cambio y se entra", async () => {
    await pedirEnlace(CARMEN, "CLAVE", ORIGEN, T0);
    await restablecerClave(await tokenDe("/clave/nueva"), "primera-1", undefined, minutos(1));
    await pedirEnlace(CARMEN, "CLAVE", ORIGEN, minutos(2));
    const token = await tokenDe("/clave/nueva");

    const corta = await pedir(confirmarHttp, { token, clave: "123" });
    expect(corta.status).toBe(400);
    expect((await corta.json()).campos).toEqual({ clave: "La clave necesita al menos 6 números o letras." });

    const lista = await pedir(confirmarHttp, { token, clave: "segunda-2" });
    expect(lista.status).toBe(200);
    expect(await lista.json()).toEqual({ destino: "/entrar/privacidad" });
    expect(lista.headers.get("set-cookie")).toMatch(/^sesion=[\w-]{43};/);

    await expect(iniciarSesionConClave({ dni: CARMEN, clave: "primera-1" })).rejects.toThrow();
    await expect(iniciarSesionConClave({ dni: CARMEN, clave: "segunda-2" })).resolves.toBeDefined();
    expect(await ultimoAviso()).toMatchObject({
      titulo: "Su clave de respaldo cambió",
      plantilla: "clave_cambiada",
      parametros: ["Carmen"],
    });
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "restablecer_clave_respaldo" } }),
    ).toBeGreaterThan(0);
    // El enlace ya se usó.
    expect((await pedir(confirmarHttp, { token, clave: "tercera-3" })).status).toBe(409);
  });
});
