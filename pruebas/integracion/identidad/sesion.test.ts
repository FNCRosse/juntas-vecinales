import { POST as entrar } from "@/app/api/auth/clave/route";
import { DELETE as salir } from "@/app/api/auth/sesion/route";
import { crearAdministradorInicial } from "@/compartido/bd/administradorInicial";
import { prisma } from "@/compartido/bd/cliente";
import { negarseEnNube, sembrar } from "@/compartido/bd/semillas";
import { ErrorEnPausa, ErrorNoAutenticado, ErrorNoAutorizado } from "@/compartido/errores";
import {
  iniciarSesionConClave,
  MENSAJE_EN_PAUSA,
  MENSAJE_NO_COINCIDE,
} from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import { exigirRol, exigirSesion, obtenerSesion } from "@/modulos/identidad/aplicacion/sesion";

const CLAVE = "clave-de-prueba";
const ANA = "40000001";
const T0 = new Date("2026-10-05T15:00:00Z");
const minutos = (m: number) => new Date(T0.getTime() + m * 60_000);

const pedir = (cuerpo: unknown) =>
  entrar(
    new Request("http://localhost/api/auth/clave", { method: "POST", body: JSON.stringify(cuerpo) }),
    undefined,
  );
const tokenDe = (respuesta: Response) =>
  respuesta.headers.get("set-cookie")?.match(/^sesion=([^;]*)/)?.[1] ?? "";

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_sesiones, identidad_credenciales, identidad_usuarios CASCADE`;
  await sembrar(CLAVE);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-21 Entrada del equipo con DNI y clave", () => {
  it.each([
    [ANA, "/administracion"],
    ["40000002", "/directiva"],
    ["40000003", "/directiva"],
    ["40000004", "/garita"],
  ])("@HU-GAR-21 CA2 el DNI %s entra con su clave y va a %s", async (dni, destino) => {
    const respuesta = await pedir({ dni, clave: CLAVE });
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ destino });
    const cookie = respuesta.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(await obtenerSesion(tokenDe(respuesta))).toMatchObject({ usuarioId: expect.any(String) });
    // En la BD está el hash del token, nunca el token.
    expect(await prisma.sesion.count({ where: { tokenHash: tokenDe(respuesta) } })).toBe(0);
  });

  it("@HU-GAR-24 CA2 una clave que no coincide o un DNI que no existe responden igual, sin revelar cuál falló", async () => {
    const malaClave = await pedir({ dni: ANA, clave: "otra" });
    const sinDni = await pedir({ dni: "99999999", clave: CLAVE });
    expect(malaClave.status).toBe(401);
    expect(sinDni.status).toBe(401);
    expect(await malaClave.json()).toEqual({ error: MENSAJE_NO_COINCIDE });
    expect(await sinDni.json()).toEqual({ error: MENSAJE_NO_COINCIDE });
    // Una vecina sin clave de respaldo tampoco entra con clave.
    await expect(iniciarSesionConClave({ dni: "08123478", clave: CLAVE })).rejects.toBeInstanceOf(
      ErrorNoAutenticado,
    );
  });

  it("@HU-GAR-24 CA3 tras cinco fallos seguidos pausa la entrada con clave 15 minutos, aunque luego acierte", async () => {
    for (let i = 0; i < 4; i++) {
      await expect(iniciarSesionConClave({ dni: ANA, clave: "otra" }, T0)).rejects.toThrow(
        MENSAJE_NO_COINCIDE,
      );
    }
    await expect(iniciarSesionConClave({ dni: ANA, clave: "otra" }, T0)).rejects.toBeInstanceOf(ErrorEnPausa);
    await expect(iniciarSesionConClave({ dni: ANA, clave: CLAVE }, minutos(10))).rejects.toThrow(
      MENSAJE_EN_PAUSA,
    );
    await expect(iniciarSesionConClave({ dni: ANA, clave: CLAVE }, minutos(15))).resolves.toMatchObject({
      sesion: { roles: ["ADMINISTRADOR"] },
    });
  });

  it("@HU-GAR-24 CA3 la pausa responde 429 con el mensaje en lenguaje llano", async () => {
    for (let i = 0; i < 5; i++) await pedir({ dni: ANA, clave: "otra" });
    const respuesta = await pedir({ dni: ANA, clave: CLAVE });
    expect(respuesta.status).toBe(429);
    expect(await respuesta.json()).toEqual({ error: MENSAJE_EN_PAUSA });
  });

  it("@HU-GAR-21 CA2 un DNI con forma incorrecta o sin clave responde 400 con el mensaje de cada campo", async () => {
    const respuesta = await pedir({ dni: "123", clave: "" });
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).campos).toEqual({
      dni: "Su DNI tiene 8 números. Revíselo y vuelva a escribirlo.",
      clave: "Falta la clave. Péguela desde su gestor o escríbala.",
    });
  });

  it("@HU-GAR-21 CA2 una cuenta desvinculada no entra", async () => {
    await prisma.usuario.update({ where: { dni: ANA }, data: { estado: "DESVINCULADA" } });
    await expect(iniciarSesionConClave({ dni: ANA, clave: CLAVE })).rejects.toBeInstanceOf(
      ErrorNoAutenticado,
    );
  });
});

describe("@HU-GAR-03 Sesión persistente", () => {
  it("@HU-GAR-03 CA2 la sesión sigue vigente al volver y se renueva con el uso", async () => {
    const { token } = await iniciarSesionConClave({ dni: ANA, clave: CLAVE });
    const [fila] = await prisma.sesion.findMany();
    expect(await obtenerSesion(token, new Date(fila.ultimoUsoEn.getTime() + 30 * 60_000))).not.toBeNull();
    expect((await prisma.sesion.findFirstOrThrow()).ultimoUsoEn).toEqual(fila.ultimoUsoEn);
    const despues = new Date(fila.ultimoUsoEn.getTime() + 90 * 24 * 60 * 60_000);
    expect(await obtenerSesion(token, despues)).not.toBeNull();
    expect((await prisma.sesion.findFirstOrThrow()).ultimoUsoEn).toEqual(despues);
  });

  it("@HU-GAR-03 CA2 cerrar sesión la revoca y borra la cookie", async () => {
    const { token } = await iniciarSesionConClave({ dni: ANA, clave: CLAVE });
    const respuesta = await salir(
      new Request("http://localhost/api/auth/sesion", {
        method: "DELETE",
        headers: { cookie: `otra=1; sesion=${token}` },
      }),
      undefined,
    );
    expect(respuesta.status).toBe(204);
    expect(respuesta.headers.get("set-cookie")).toMatch(/^sesion=; Max-Age=0/);
    expect(await obtenerSesion(token)).toBeNull();
    expect(await obtenerSesion(undefined)).toBeNull();
    expect(await obtenerSesion("token-inventado")).toBeNull();
  });

  it("@HU-GAR-03 una cuenta que deja de estar activa pierde su sesión", async () => {
    const { token } = await iniciarSesionConClave({ dni: ANA, clave: CLAVE });
    await prisma.usuario.update({ where: { dni: ANA }, data: { estado: "SUSPENDIDA" } });
    expect(await obtenerSesion(token)).toBeNull();
  });

  it("@HU-GAR-21 CA2 exigirSesion y exigirRol autorizan en el servidor", async () => {
    const { token } = await iniciarSesionConClave({ dni: "40000004", clave: CLAVE });
    const peticion = (cookie?: string) =>
      new Request("http://localhost/api/x", { headers: cookie ? { cookie } : {} });
    await expect(exigirSesion(peticion())).rejects.toBeInstanceOf(ErrorNoAutenticado);
    const sesion = await exigirSesion(peticion(`sesion=${token}`));
    expect(exigirRol(sesion, "VIGILANTE", "ADMINISTRADOR")).toBe(sesion);
    expect(() => exigirRol(sesion, "ADMINISTRADOR")).toThrow(ErrorNoAutorizado);
  });
});

describe("@HU-GAR-21 Cuentas iniciales", () => {
  it("@HU-GAR-21 las semillas ficticias se niegan a correr contra Neon o en producción", () => {
    expect(() => negarseEnNube("postgresql://u@ep-x.us-east-1.aws.neon.tech/db")).toThrow(
      "nunca contra Neon",
    );
    expect(() => negarseEnNube("postgresql://u@localhost:5432/db")).not.toThrow();
  });

  it("@HU-GAR-21 la cuenta inicial del administrador se crea una sola vez y con datos completos", async () => {
    await expect(crearAdministradorInicial({})).rejects.toThrow("Faltan ADMIN_INICIAL_NOMBRE");
    await expect(
      crearAdministradorInicial({
        ADMIN_INICIAL_NOMBRE: "X",
        ADMIN_INICIAL_DNI: "1",
        ADMIN_INICIAL_CLAVE: "corta",
      }),
    ).rejects.toThrow("Faltan");
    const datos = {
      ADMIN_INICIAL_NOMBRE: "Admin de prueba",
      ADMIN_INICIAL_DNI: "41111111",
      ADMIN_INICIAL_CLAVE: "una-clave-larga",
    };
    await expect(crearAdministradorInicial(datos)).rejects.toThrow("Ya existe una cuenta de administrador");

    await prisma.$executeRaw`TRUNCATE identidad_sesiones, identidad_credenciales, identidad_usuarios CASCADE`;
    await crearAdministradorInicial(datos);
    await expect(iniciarSesionConClave({ dni: "41111111", clave: "una-clave-larga" })).resolves.toMatchObject(
      {
        sesion: { nombreCompleto: "Admin de prueba", roles: ["ADMINISTRADOR"] },
      },
    );
  });
});
