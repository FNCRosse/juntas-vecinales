import { after } from "next/server";
import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { despertarWorker } from "@/compartido/notificaciones/despertar";
import { agregarAlEquipo } from "@/modulos/identidad/aplicacion/equipo";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const rol = z.enum(["DIRECTIVA", "DIRECTIVO_MEDIADOR", "VIGILANTE"], { error: "Elija qué rol tendrá." });

const deAfuera = z.object({
  tipo: z.literal("afuera"),
  nombreCompleto: z.string().trim().min(1, "Falta el nombre. Escríbalo como figura en su DNI.").max(120),
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "El DNI tiene 8 números. Revise que estén todos."),
  telefono: z
    .string()
    .transform((texto) => texto.replace(/\D/g, ""))
    .pipe(z.string().regex(/^9\d{8}$/, "El WhatsApp tiene 9 números y empieza con 9. Revíselo.")),
});

const esquema = z.object({
  persona: z.discriminatedUnion("tipo", [
    z.object({ tipo: z.literal("padron"), usuarioId: z.string().uuid() }),
    deAfuera,
  ]),
  rol,
});

/** Agregar a una persona al equipo con su rol y enviarle la invitación (HU-GAR-21). */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const { persona, rol: elegido } = esquema.parse(await leerJson(peticion));
  const origen = process.env.URL_PUBLICA || new URL(peticion.url).origin;
  const agregado = await agregarAlEquipo(sesion, persona, elegido, origen);
  after(despertarWorker);
  return Response.json(agregado, { status: 201 });
});
