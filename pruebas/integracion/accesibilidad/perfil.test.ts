import { PUT } from "@/app/api/accesibilidad/perfil/route";
import { prisma } from "@/compartido/bd/cliente";
import { cambiarSintesisVoz } from "@/modulos/accesibilidad/aplicacion/cambiarSintesisVoz";
import { obtenerPerfil } from "@/modulos/accesibilidad/aplicacion/obtenerPerfil";

const guardar = (cuerpo: unknown, cookie?: string) =>
  PUT(
    new Request("http://localhost/api/accesibilidad/perfil", {
      method: "PUT",
      headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
      body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
    }),
    undefined,
  );

const idDeLaCookie = (respuesta: Response) =>
  respuesta.headers.get("set-cookie")?.match(/^perfil=([^;]+)/)?.[1];

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE accesibilidad_perfiles`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ACC-01 Perfil de accesibilidad en el servidor (ADR-004)", () => {
  it("@HU-ACC-01 sin perfil guardado se renderiza en modo Normal", async () => {
    expect(await obtenerPerfil({ perfilId: undefined })).toMatchObject({ id: null, modoSeniorActivo: false });
    expect(await obtenerPerfil({ perfilId: "no-es-un-id" })).toMatchObject({
      id: null,
      modoSeniorActivo: false,
    });
    expect(await obtenerPerfil({ perfilId: "6f1c2a3b-0000-4000-8000-000000000000" })).toMatchObject({
      id: null,
    });
  });

  it("@HU-ACC-01 CA1 PUT guarda Letra grande en el servidor y deja la cookie del perfil", async () => {
    const respuesta = await guardar({ modoSeniorActivo: true });
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo).toMatchObject({ modoSeniorActivo: true, escalaTipografica: "GRANDE" });

    const cookie = respuesta.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(idDeLaCookie(respuesta)).toBe(cuerpo.id);

    // Al volver (recargar u otra visita con la misma cookie) el perfil sigue en Senior.
    expect(await obtenerPerfil({ perfilId: cuerpo.id })).toMatchObject({ modoSeniorActivo: true });
    expect(await prisma.perfilAccesibilidad.count()).toBe(1);
  });

  it("@HU-ACC-01 CA1 con la cookie se actualiza el mismo perfil, sin crear otro", async () => {
    const id = idDeLaCookie(await guardar({ modoSeniorActivo: true }));
    const respuesta = await guardar({ modoSeniorActivo: false }, `otra=1; perfil=${id}`);
    expect(await respuesta.json()).toMatchObject({ id, modoSeniorActivo: false });
    expect(await prisma.perfilAccesibilidad.count()).toBe(1);
  });

  it("@HU-ACC-03 CA2 un dato con forma incorrecta responde 400 con un mensaje en lenguaje llano", async () => {
    const respuesta = await guardar({ modoSeniorActivo: "sí" });
    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      error: "Revise los datos marcados y corríjalos para continuar.",
      campos: { modoSeniorActivo: "Indique si quiere la letra grande: sí o no." },
    });
    expect((await guardar("{roto")).status).toBe(400);
  });
});

describe("@HU-ACC-02 Preferencia de lectura en voz alta", () => {
  it("@HU-ACC-02 CA1 PUT guarda la lectura en voz alta sin tocar Letra grande, y sigue al volver", async () => {
    const respuesta = await guardar({ sintesisVozActiva: true });
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo).toMatchObject({ sintesisVozActiva: true, modoSeniorActivo: false });
    expect(await obtenerPerfil({ perfilId: cuerpo.id })).toMatchObject({ sintesisVozActiva: true });

    // Cambiar Letra grande después no apaga la voz, y apagar la voz no apaga Letra grande.
    const cookie = `perfil=${cuerpo.id}`;
    expect(await (await guardar({ modoSeniorActivo: true }, cookie)).json()).toMatchObject({
      sintesisVozActiva: true,
      modoSeniorActivo: true,
    });
    expect(await (await guardar({ sintesisVozActiva: false }, cookie)).json()).toMatchObject({
      sintesisVozActiva: false,
      modoSeniorActivo: true,
    });
    expect(await prisma.perfilAccesibilidad.count()).toBe(1);
  });

  it("@HU-ACC-02 CA1 con sesión la preferencia queda en la cuenta, igual desde otro dispositivo", async () => {
    const usuario = await prisma.usuario.create({
      data: { nombreCompleto: "Vecina de prueba", dni: "70000099", roles: ["VECINO_ADULTO_MAYOR"] },
    });
    try {
      await cambiarSintesisVoz({ usuarioId: usuario.id }, true);
      expect(await obtenerPerfil({ usuarioId: usuario.id })).toMatchObject({ sintesisVozActiva: true });
    } finally {
      await prisma.perfilAccesibilidad.deleteMany({ where: { usuarioId: usuario.id } });
      await prisma.usuario.delete({ where: { id: usuario.id } });
    }
  });

  it("@HU-ACC-02 sin decir qué cambiar responde 400 en lenguaje llano", async () => {
    const respuesta = await guardar({});
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).campos).toEqual({
      modoSeniorActivo: "Indique si quiere la letra grande: sí o no.",
    });
  });
});
