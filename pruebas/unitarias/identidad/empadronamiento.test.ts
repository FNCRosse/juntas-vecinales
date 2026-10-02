import { despertarWorker } from "@/compartido/notificaciones/despertar";
import { plantillaEnlaceAcceso } from "@/compartido/notificaciones/plantillas";
import {
  type PersonaNueva,
  revisarPersonas,
  telefonoCompleto,
} from "@/modulos/identidad/dominio/empadronamiento";
import { venceEn } from "@/modulos/identidad/dominio/magicLink";
import { type DatosPredio, direccion, normalizarPredio } from "@/modulos/identidad/dominio/predio";

const predio = (cambios: Partial<DatosPredio> = {}): DatosPredio => ({
  manzana: "c",
  lote: " 7 ",
  uso: "VIVIENDA",
  familias: 1,
  inquilinos: 0,
  autos: 0,
  motos: 0,
  triciclos: 0,
  negocios: 0,
  ...cambios,
});

const persona = (cambios: Partial<PersonaNueva> = {}): PersonaNueva => ({
  nombreCompleto: "Sofía Castro",
  dni: "45678123",
  dniVisto: true,
  relacion: "TITULAR",
  cuentaPropia: true,
  telefono: "912345678",
  ...cambios,
});

describe("@HU-GAR-01 Predio", () => {
  it("@HU-GAR-01 CA1 normaliza manzana y lote para que el lote único funcione", () => {
    expect(normalizarPredio(predio())).toEqual({ predio: predio({ manzana: "C", lote: "7" }), errores: {} });
    expect(direccion({ manzana: "C", lote: "7" })).toBe("Mz. C, lote 7");
  });

  it("@HU-GAR-01 CA1 pide manzana, lote y conteos dentro del contador; un negocio puede no tener familias", () => {
    expect(
      normalizarPredio(predio({ manzana: " ", lote: "", familias: 0, autos: 10, motos: 1.5 })).errores,
    ).toEqual({
      manzana: "Falta la manzana. Escriba su letra, por ejemplo C.",
      lote: "Falta el número de lote. Escríbalo en el campo Lote.",
      familias: "Elija un número entre 1 y 9.",
      autos: "Elija un número entre 0 y 9.",
      motos: "Elija un número entre 0 y 9.",
    });
    expect(normalizarPredio(predio({ uso: "NEGOCIO", familias: 0, negocios: 1 })).errores).toEqual({});
  });
});

describe("@HU-GAR-01 Personas del empadronamiento", () => {
  it("@HU-GAR-01 CA1 sin errores cuando cada DNI se vio y cada cuenta tiene su WhatsApp", () => {
    const otro = persona({ dni: "45678999", relacion: "HIJO", cuentaPropia: false, telefono: undefined });
    expect(
      revisarPersonas([
        { prefijo: "titular", persona: persona() },
        { prefijo: "otros.0", persona: otro },
      ]),
    ).toEqual({});
  });

  it("@HU-GAR-01 CA3 no deja repetir un DNI ni un WhatsApp dentro de la vivienda", () => {
    const repetida = persona({ relacion: "CONYUGE", dniVisto: false });
    expect(
      revisarPersonas([
        { prefijo: "titular", persona: persona() },
        { prefijo: "otros.0", persona: repetida },
      ]),
    ).toEqual({
      "otros.0.dniVisto": "Falta confirmar que vio el DNI de esta persona.",
      "otros.0.dni": "Este DNI ya está en esta vivienda. Revise los números.",
      "otros.0.telefono": "Cada cuenta necesita su propio WhatsApp. Escriba otro número.",
    });
  });

  it("@HU-GAR-01 CA2 el WhatsApp se guarda con el código del Perú", () => {
    expect(telefonoCompleto("912345678")).toBe("51912345678");
  });
});

describe("@HU-GAR-01 Enlace de entrada", () => {
  it("@HU-GAR-01 CA2 vence a los 15 minutos de emitido", () => {
    expect(venceEn(new Date("2026-10-05T15:00:00Z"))).toEqual(new Date("2026-10-05T15:15:00Z"));
  });

  it("@HU-GAR-01 CA2 la plantilla de WhatsApp lleva el nombre y el enlace, en ese orden", () => {
    expect(plantillaEnlaceAcceso("Sofía", "https://x/entrar/t")).toEqual({
      plantilla: "enlace_acceso",
      parametros: ["Sofía", "https://x/entrar/t"],
    });
  });

  it("@HU-GAR-01 CA2 despierta al worker con su secreto; sin configuración o si falla, lo deja al cron", async () => {
    const original = global.fetch;
    const llamada = jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
    global.fetch = llamada;
    try {
      await expect(despertarWorker(undefined, undefined)).resolves.toBe(false);
      await expect(despertarWorker("https://worker.ejemplo", "s")).resolves.toBe(true);
      expect(llamada).toHaveBeenCalledWith(
        "https://worker.ejemplo/tareas/ejecutar",
        expect.objectContaining({ method: "POST", headers: { "x-secreto-worker": "s" } }),
      );
      llamada.mockRejectedValueOnce(new Error("sin red"));
      jest.spyOn(console, "error").mockImplementationOnce(() => {});
      await expect(despertarWorker("https://worker.ejemplo", "s")).resolves.toBe(false);
    } finally {
      global.fetch = original;
    }
  });
});
