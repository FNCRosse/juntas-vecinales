import { z } from "zod";

// Forma de los datos del asistente de empadronamiento (HU-GAR-01). Las reglas que cruzan campos o
// miran la BD están en modulos/identidad.

const contador = z.number().int();

const vivienda = z.object({
  manzana: z.string().max(3, "La manzana es una letra, por ejemplo C."),
  lote: z.string().max(5, "El lote tiene como mucho 5 caracteres. Revíselo."),
  uso: z.enum(["VIVIENDA", "NEGOCIO", "VIVIENDA_Y_NEGOCIO"], { error: "Elija para qué se usa." }),
  familias: contador,
  inquilinos: contador,
  autos: contador,
  motos: contador,
  triciclos: contador,
  negocios: contador,
});

const nombre = z.string().trim().min(1, "Falta el nombre. Escríbalo como figura en su DNI.").max(120);
const dni = z
  .string()
  .trim()
  .regex(/^\d{8}$/, "El DNI tiene 8 números. Revise que estén todos.");
const telefono = z
  .string()
  .transform((texto) => texto.replace(/\D/g, ""))
  .pipe(z.string().regex(/^9\d{8}$/, "El WhatsApp tiene 9 números y empieza con 9. Revíselo."));
const opcional = <T extends z.ZodType>(esquema: T) =>
  z.preprocess((valor) => (valor === "" || valor === null ? undefined : valor), esquema.optional());

const titular = z.object({
  nombreCompleto: nombre,
  dni,
  dniVisto: z.boolean(),
  telefono: opcional(telefono),
});

const otro = titular.extend({
  relacion: z.enum(["CONYUGE", "HIJO", "PADRE", "OTRO"], { error: "Elija qué es de la persona titular." }),
  cuentaPropia: z.boolean(),
});

export const esquemaPlacas = z.object({
  autos: z.array(z.string()).max(9),
  motos: z.array(z.string()).max(9),
});

export const esquemaEmpadronamiento = z.object({
  vivienda,
  placas: esquemaPlacas.optional(),
  titular: titular.optional(),
  otros: z.array(otro).max(20).optional(),
});
