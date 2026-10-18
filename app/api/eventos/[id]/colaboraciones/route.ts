import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { colaborar } from "@/modulos/asambleas/aplicacion/actividades";

const esquema = z.object({
  cantidad: z.number({ error: "Elija cuántos." }),
  modalidad: z.enum(["ANTICIPADA", "EN_PUERTA"], { error: "Elija cómo desea colaborar." }),
  idOperacion: z.uuid(),
});

/** La casa elige su aporte a una actividad pro fondos (HU-ASA-08): 201 al registrarlo; 200 si ya estaba (AC-5). */
export const POST = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { colaboracion, creada } = await colaborar(
    sesion,
    (await params).id,
    esquema.parse(await leerJson(peticion)),
  );
  return Response.json(colaboracion, { status: creada ? 201 : 200 });
});
