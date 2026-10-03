import { GET as guiasHttp, POST as accionHttp } from "@/app/api/accesibilidad/onboarding/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { guiaDeSeccion, guiasDeUso, registrarAccionDeGuia } from "@/modulos/accesibilidad/aplicacion/guias";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";

let marta: string;
let token: string;

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, accesibilidad_guias CASCADE`;
  await sembrar("clave-de-prueba");
  const r = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" });
  marta = r.sesion.usuarioId;
  token = r.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const pedir = (cuerpo?: unknown) =>
  new Request("http://localhost/api/accesibilidad/onboarding", {
    method: cuerpo ? "POST" : "GET",
    headers: { cookie: `sesion=${token}` },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

describe("@HU-ACC-10 Tutorial guiado por sección", () => {
  it("@HU-ACC-10 CA1 la primera vez en Incidentes se ofrece la guía, de cinco pasos o menos", async () => {
    const guia = await guiaDeSeccion(marta, "INCIDENTES");
    expect(guia).toMatchObject({ nombre: "Incidentes", estado: null, paso: 0, ofrecer: true });
    expect(guia.pasos.length).toBeLessThanOrEqual(5);
    await expect(guiaDeSeccion(marta, "OTRA")).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-ACC-10 CA2 CA3 se pausa y se retoma; omitida o completada, ya no se ofrece sola y se puede volver a ver", async () => {
    const pausa = await accionHttp(pedir({ seccion: "INCIDENTES", accion: "pausar", paso: 1 }), undefined);
    expect(await pausa.json()).toMatchObject({ estado: "PAUSADA", paso: 1, ofrecer: true });
    expect(await (await guiasHttp(pedir(), undefined)).json()).toEqual([
      { seccion: "INCIDENTES", nombre: "Incidentes", estado: "La dejó en el paso 2 de 4" },
    ]);
    await registrarAccionDeGuia(marta, "INCIDENTES", "omitir");
    expect((await guiaDeSeccion(marta, "INCIDENTES")).ofrecer).toBe(false);
    await registrarAccionDeGuia(marta, "INCIDENTES", "reactivar");
    await registrarAccionDeGuia(marta, "INCIDENTES", "completar");
    expect(await guiaDeSeccion(marta, "INCIDENTES")).toMatchObject({ estado: "COMPLETADA", ofrecer: false });
    expect(await guiasDeUso(marta)).toEqual([
      { seccion: "INCIDENTES", nombre: "Incidentes", estado: "Ya la vio" },
    ]);
    expect((await accionHttp(pedir({ seccion: "INCIDENTES", accion: "borrar" }), undefined)).status).toBe(
      400,
    );
  });
});
