import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import {
  cambiarOposicion,
  solicitarCancelacion,
  solicitarCopia,
  solicitarRectificacion,
} from "@/modulos/identidad/aplicacion/arco";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const esquema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("ACCESO") }),
  z.object({
    tipo: z.literal("RECTIFICACION"),
    campo: z.enum(["NOMBRE", "DNI", "DIRECCION"], { message: "Elija qué dato quiere corregir." }),
    valor: z.string().max(120, "Escriba como mucho 120 letras."),
    detalle: z.string().max(500, "Escriba como mucho 500 letras.").optional(),
  }),
  z.object({
    tipo: z.literal("CANCELACION"),
    motivo: z.enum(["MUDANZA", "NO_DESEA", "OTRO"], { message: "Elija por qué la cancela." }),
    detalle: z.string().max(500, "Escriba como mucho 500 letras.").optional(),
  }),
  z.object({ tipo: z.literal("OPOSICION"), activa: z.boolean() }),
]);

/**
 * Solicitudes de privacidad del vecino (Ley N.° 29733): copia de sus datos (HU-GAR-12), corrección
 * (HU-GAR-13), cancelación (HU-GAR-14) y oposición a mostrar su ubicación exacta (HU-GAR-15).
 */
export const POST = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const cuerpo = esquema.parse(await leerJson(peticion));
  switch (cuerpo.tipo) {
    case "ACCESO": {
      const copia = await solicitarCopia(sesion);
      return Response.json(
        { ...copia, descarga: `/api/arco/solicitudes/${copia.id}/copia` },
        { status: 201 },
      );
    }
    case "RECTIFICACION":
      return Response.json(await solicitarRectificacion(sesion, cuerpo), { status: 201 });
    case "CANCELACION":
      return Response.json(await solicitarCancelacion(sesion, cuerpo), { status: 201 });
    case "OPOSICION":
      return Response.json(await cambiarOposicion(sesion, cuerpo.activa), { status: 201 });
  }
});
