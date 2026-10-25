import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { avisarCuotaNueva, cuotaDeHoy } from "@/modulos/aportes/aplicacion/cuotaDelPadron";
import { actualizarPredio } from "@/modulos/identidad/aplicacion/gestionarPadron";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

const contador = z.number().int();
const esquema = z.object({
  uso: z.enum(["VIVIENDA", "NEGOCIO", "VIVIENDA_Y_NEGOCIO"], { error: "Elija para qué se usa." }),
  familias: contador,
  inquilinos: contador,
  autos: contador,
  motos: contador,
  triciclos: contador,
  negocios: contador,
  placas: z.object({ autos: z.array(z.string()).max(9), motos: z.array(z.string()).max(9) }).optional(),
});

/**
 * Actualizar el uso y la ocupación del predio (HU-GAR-10). La cuota se recalcula sola desde el siguiente ciclo (HU-COB-01); en la
 * misma transacción se avisa a la casa su monto nuevo si cambia (M5), compuesto aquí porque identidad no usa a aportes.
 */
export const PATCH = manejar<{ params: Promise<{ predioId: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const datos = esquema.parse(await leerJson(peticion));
  const { predioId } = await params;
  const hoy = await cuotaDeHoy(predioId);
  return Response.json(
    await actualizarPredio(sesion, predioId, datos, (tx, ocupacion) =>
      avisarCuotaNueva(tx, predioId, hoy, ocupacion),
    ),
  );
});
