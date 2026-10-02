import { PUT as guardarPerfilHttp } from "@/app/api/accesibilidad/perfil/route";
import { POST as canjearHttp } from "@/app/api/auth/canjear/route";
import { POST as claveHttp } from "@/app/api/auth/clave-respaldo/route";
import { POST as politicaHttp } from "@/app/api/auth/politica/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorConflicto } from "@/compartido/errores";
import { cambiarModoSenior } from "@/modulos/accesibilidad/aplicacion/cambiarModoSenior";
import { obtenerPerfil } from "@/modulos/accesibilidad/aplicacion/obtenerPerfil";
import { empadronar } from "@/modulos/identidad/aplicacion/empadronar";
import { emitirEnlace } from "@/modulos/identidad/aplicacion/emitirEnlace";
import {
  canjearEnlace,
  consultarEnlace,
  MENSAJE_ENLACE_NO_SIRVE,
} from "@/modulos/identidad/aplicacion/entrarConEnlace";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import { MENSAJE_FALTA_ACEPTAR } from "@/modulos/identidad/aplicacion/primerIngreso";
import { obtenerSesion } from "@/modulos/identidad/aplicacion/sesion";
import { VERSION_POLITICA } from "@/modulos/identidad/dominio/politica";

jest.mock("next/server", () => ({ after: jest.fn() }));

const ORIGEN = "https://jv.ejemplo";
const T0 = new Date("2026-10-05T15:00:00Z");
const minutos = (m: number) => new Date(T0.getTime() + m * 60_000);
const DNI_SOFIA = "45678123";

/** Empadrona a Sofía y devuelve el token de su enlace, tal como sale en la cola hacia WhatsApp. */
async function enlaceDeSofia() {
  const { sesion: ana } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" });
  await empadronar(
    ana,
    {
      vivienda: {
        manzana: "C",
        lote: "15",
        uso: "VIVIENDA",
        familias: 1,
        inquilinos: 0,
        autos: 0,
        motos: 0,
        triciclos: 0,
        negocios: 0,
      },
      titular: { nombreCompleto: "Sofía Castro Ríos", dni: DNI_SOFIA, dniVisto: true, telefono: "912345678" },
    },
    ORIGEN,
    T0,
  );
  return tokenEnCola();
}

async function tokenEnCola() {
  const aviso = await prisma.avisoEnCola.findFirstOrThrow({ orderBy: { creadoEn: "desc" } });
  return aviso.parametros[1].replace(`${ORIGEN}/entrar/`, "");
}

const pedir = (ruta: typeof canjearHttp, cuerpo: unknown, cookie = "") =>
  ruta(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { cookie },
      body: JSON.stringify(cuerpo),
    }),
    undefined,
  );
const cookieDe = (respuesta: Response) => respuesta.headers.get("set-cookie")?.split(";")[0] ?? "";

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, accesibilidad_perfiles CASCADE`;
  await sembrar("clave-de-prueba");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-02 Entrar con el enlace", () => {
  it("@HU-GAR-02 CA1 abrir la página muestra a quién es el enlace sin gastarlo", async () => {
    const token = await enlaceDeSofia();
    expect(await consultarEnlace(token, minutos(1))).toEqual({
      estado: "VIGENTE",
      nombre: "Sofía",
      direccion: "Mz. C, lote 15",
    });
    expect(await consultarEnlace(token, minutos(2))).toMatchObject({ estado: "VIGENTE" });
    expect(await consultarEnlace("token-inventado")).toEqual({ estado: "VENCIDO" });
  });

  it("@HU-GAR-02 CA1 entra sin clave con un enlace vigente y sin usar; después ya no sirve", async () => {
    const token = await enlaceDeSofia();
    const { token: sesion, destino } = await canjearEnlace(token, undefined, minutos(5));
    expect(destino).toBe("/entrar/privacidad");
    expect(await obtenerSesion(sesion)).toMatchObject({
      nombreCompleto: "Sofía Castro Ríos",
      roles: ["VECINO"],
    });
    expect(await consultarEnlace(token, minutos(6))).toEqual({ estado: "USADO" });
    await expect(canjearEnlace(token, undefined, minutos(6))).rejects.toEqual(
      new ErrorConflicto(MENSAJE_ENLACE_NO_SIRVE),
    );
  });

  it("@HU-GAR-02 CA1 un enlace vencido o reemplazado por uno nuevo no deja entrar", async () => {
    const token = await enlaceDeSofia();
    expect(await consultarEnlace(token, minutos(15))).toEqual({ estado: "VENCIDO" });
    await expect(canjearEnlace(token, undefined, minutos(15))).rejects.toBeInstanceOf(ErrorConflicto);

    const sofia = await prisma.usuario.findUniqueOrThrow({ where: { dni: DNI_SOFIA } });
    await prisma.$transaction((tx) => emitirEnlace(tx, sofia, ORIGEN, minutos(1)));
    expect(await consultarEnlace(token, minutos(2))).toEqual({ estado: "ANULADO" });
    await expect(canjearEnlace(await tokenEnCola(), undefined, minutos(2))).resolves.toMatchObject({
      destino: "/entrar/privacidad",
    });
  });

  it("@HU-GAR-02 CA1 si el enlace se abre dos veces a la vez, solo una entra", async () => {
    const token = await enlaceDeSofia();
    const resultados = await Promise.allSettled([
      canjearEnlace(token, undefined, minutos(1)),
      canjearEnlace(token, undefined, minutos(1)),
    ]);
    expect(resultados.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(await prisma.sesion.count({ where: { usuario: { dni: DNI_SOFIA } } })).toBe(1);
  });

  it("@HU-GAR-02 CA1 una cuenta suspendida no entra con su enlace", async () => {
    const token = await enlaceDeSofia();
    await prisma.usuario.update({ where: { dni: DNI_SOFIA }, data: { estado: "SUSPENDIDA" } });
    expect(await consultarEnlace(token, minutos(1))).toEqual({ estado: "VENCIDO" });
    await expect(canjearEnlace(token, undefined, minutos(1))).rejects.toBeInstanceOf(ErrorConflicto);
  });

  it("@HU-GAR-02 CA1 CA2 CA3 por HTTP: entra, acepta la política y crea su clave de respaldo", async () => {
    const token = await enlaceDeSofia();
    expect((await pedir(canjearHttp, { token: "corto" })).status).toBe(400);
    const entrada = await pedir(canjearHttp, { token });
    expect(entrada.status).toBe(200);
    expect(entrada.headers.get("set-cookie")).toMatch(
      /^sesion=[\w-]{43}; Max-Age=\d+; Path=\/; HttpOnly; Secure/,
    );
    const cookie = cookieDe(entrada);

    // CA2: sin marcar la casilla no avanza, y el mensaje dice qué hacer.
    const sinAceptar = await pedir(politicaHttp, { acepto: false }, cookie);
    expect(sinAceptar.status).toBe(400);
    expect((await sinAceptar.json()).campos).toEqual({ acepto: MENSAJE_FALTA_ACEPTAR });
    expect((await pedir(politicaHttp, { acepto: true })).status).toBe(401);

    const aceptada = await pedir(politicaHttp, { acepto: true }, cookie);
    expect(await aceptada.json()).toEqual({ destino: "/entrar/clave-respaldo" });
    const sofia = await prisma.usuario.findUniqueOrThrow({ where: { dni: DNI_SOFIA } });
    expect(sofia.politicaVersion).toBe(VERSION_POLITICA);
    expect(sofia.politicaAceptadaEn).not.toBeNull();
    expect(await obtenerSesion(cookie.replace("sesion=", ""))).toMatchObject({ politicaAceptada: true });
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({
      where: { entidadId: sofia.id, accion: "aceptar_politica" },
    });
    expect(auditoria).toMatchObject({ actorId: sofia.id, despues: { politicaVersion: VERSION_POLITICA } });
    // Aceptar otra vez no duplica el registro.
    await pedir(politicaHttp, { acepto: true }, cookie);
    expect(
      await prisma.registroAuditoria.count({ where: { entidadId: sofia.id, accion: "aceptar_politica" } }),
    ).toBe(1);

    // CA3: clave de respaldo opcional, vinculada a su DNI.
    const corta = await pedir(claveHttp, { clave: "12345" }, cookie);
    expect(corta.status).toBe(400);
    expect((await corta.json()).campos).toEqual({ clave: "La clave necesita al menos 6 números o letras." });
    const creada = await pedir(claveHttp, { clave: "mi-clave-1" }, cookie);
    expect(creada.status).toBe(201);
    expect(await creada.json()).toEqual({ destino: "/" });
    await expect(iniciarSesionConClave({ dni: DNI_SOFIA, clave: "mi-clave-1" })).resolves.toMatchObject({
      sesion: { nombreCompleto: "Sofía Castro Ríos", politicaAceptada: true },
    });
    const registro = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "crear_clave_respaldo" },
    });
    expect(JSON.stringify(registro)).not.toContain("mi-clave-1");
    // Con clave y política, la próxima aceptación lleva al inicio.
    expect(await (await pedir(politicaHttp, { acepto: true }, cookie)).json()).toEqual({ destino: "/" });
  });

  it("@HU-GAR-02 CA2 una versión nueva de la política se vuelve a pedir", async () => {
    const token = await enlaceDeSofia();
    const { token: sesion } = await canjearEnlace(token, undefined, minutos(1));
    await prisma.usuario.update({ where: { dni: DNI_SOFIA }, data: { politicaVersion: "2020-01" } });
    expect(await obtenerSesion(sesion)).toMatchObject({ politicaAceptada: false });
  });
});

describe("@HU-ACC-01 Modo Senior guardado en la cuenta", () => {
  it("@HU-ACC-01 CA1 lo que eligió antes de entrar pasa a su cuenta y se ve desde otro dispositivo", async () => {
    const enDispositivo = await cambiarModoSenior({ perfilId: undefined }, true);
    const token = await enlaceDeSofia();
    const { sesion } = await canjearEnlace(token, enDispositivo.id ?? undefined, minutos(1));
    // Otro dispositivo: sin la cookie del perfil, solo con la sesión.
    expect(await obtenerPerfil({ usuarioId: sesion.usuarioId })).toMatchObject({
      id: enDispositivo.id,
      modoSeniorActivo: true,
    });
  });

  it("@HU-ACC-01 CA1 si la cuenta ya tenía perfil, manda el de la cuenta", async () => {
    const token = await enlaceDeSofia();
    const sofia = await prisma.usuario.findUniqueOrThrow({ where: { dni: DNI_SOFIA } });
    const deLaCuenta = await cambiarModoSenior({ usuarioId: sofia.id }, true);
    const otroDispositivo = await cambiarModoSenior({ perfilId: undefined }, false);
    await canjearEnlace(token, otroDispositivo.id ?? undefined, minutos(1));
    expect(
      await obtenerPerfil({ usuarioId: sofia.id, perfilId: otroDispositivo.id ?? undefined }),
    ).toMatchObject({
      id: deLaCuenta.id,
      modoSeniorActivo: true,
    });
    expect(
      (await prisma.perfilAccesibilidad.findUniqueOrThrow({ where: { id: otroDispositivo.id! } })).usuarioId,
    ).toBeNull();
  });

  it("@HU-ACC-01 CA1 con sesión, el switch guarda en la cuenta; al entrar con clave también pasa el perfil", async () => {
    const enDispositivo = await cambiarModoSenior({ perfilId: undefined }, true);
    const { token, sesion } = await iniciarSesionConClave(
      { dni: "40000002", clave: "clave-de-prueba" },
      undefined,
      enDispositivo.id ?? undefined,
    );
    expect(await obtenerPerfil({ usuarioId: sesion.usuarioId })).toMatchObject({ modoSeniorActivo: true });

    const respuesta = await guardarPerfilHttp(
      new Request("http://localhost/api/accesibilidad/perfil", {
        method: "PUT",
        headers: { cookie: `sesion=${token}` },
        body: JSON.stringify({ modoSeniorActivo: false }),
      }),
      undefined,
    );
    expect(respuesta.status).toBe(200);
    expect(await obtenerPerfil({ usuarioId: sesion.usuarioId })).toMatchObject({
      id: enDispositivo.id,
      modoSeniorActivo: false,
    });
  });
});
