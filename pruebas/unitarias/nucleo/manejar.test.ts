import { z } from "zod";
import {
  ErrorConflicto,
  ErrorNoAutenticado,
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorReglaNegocio,
  ErrorValidacion,
  MENSAJE_ERROR_INESPERADO,
} from "@/compartido/errores";
import { leerJson, manejar } from "@/compartido/manejar";

const peticion = (cuerpo?: string) =>
  new Request("http://localhost/api/prueba", { method: "POST", body: cuerpo });
const ejecutar = (error: unknown) =>
  manejar(async () => {
    throw error;
  })(peticion(), undefined);

describe("@HU-ACC-03 manejar() y los errores tipados", () => {
  it("@HU-ACC-03 deja pasar la respuesta cuando no hay error", async () => {
    const respuesta = await manejar(async () => Response.json({ ok: true }, { status: 201 }))(peticion(), {});
    expect(respuesta.status).toBe(201);
  });

  it.each([
    [new ErrorValidacion(), 400],
    [new ErrorNoAutenticado(), 401],
    [new ErrorNoAutorizado(), 403],
    [new ErrorNoEncontrado(), 404],
    [new ErrorConflicto("Este enlace ya se usó. Pida uno nuevo."), 409],
    [new ErrorReglaNegocio("Ya representa a dos vecinos. No puede recibir otro voto."), 422],
  ])("@HU-ACC-03 CA2 traduce %p a su código HTTP con el mensaje para la persona", async (error, estado) => {
    const respuesta = await ejecutar(error);
    expect(respuesta.status).toBe(estado);
    expect(await respuesta.json()).toEqual({ error: error.mensaje });
  });

  it("@HU-ACC-03 CA2 un error de zod es 400 con el mensaje de cada campo para mostrarlo a su lado", async () => {
    const esquema = z.object({
      dni: z.string().length(8, "Al DNI le faltan números. Escriba sus 8 números."),
      datos: z.object({ telefono: z.string({ error: "Falta el teléfono. Escríbalo con sus 9 números." }) }),
    });
    const respuesta = await manejar(async () => {
      esquema.parse({ dni: "123", datos: {} });
      return new Response();
    })(peticion(), undefined);

    expect(respuesta.status).toBe(400);
    expect(await respuesta.json()).toEqual({
      error: "Revise los datos marcados y corríjalos para continuar.",
      campos: {
        dni: "Al DNI le faltan números. Escriba sus 8 números.",
        "datos.telefono": "Falta el teléfono. Escríbalo con sus 9 números.",
      },
    });
  });

  it("@HU-ACC-03 CA2 un error inesperado es 500 sin detalles técnicos y queda en el log", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    const respuesta = await ejecutar(new TypeError("cannot read properties of undefined"));
    expect(respuesta.status).toBe(500);
    expect(await respuesta.json()).toEqual({ error: MENSAJE_ERROR_INESPERADO });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("@HU-ACC-03 CA2 un cuerpo que no es JSON es un error de validación, no un 500", async () => {
    await expect(leerJson(peticion("{no es json"))).rejects.toBeInstanceOf(ErrorValidacion);
    await expect(leerJson(peticion('{"a":1}'))).resolves.toEqual({ a: 1 });
  });
});
