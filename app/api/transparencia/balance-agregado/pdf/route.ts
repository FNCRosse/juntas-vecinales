import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { cuentasDelBarrioEnPdf } from "@/modulos/transparencia/aplicacion/cuentasDelBarrio";

/** Las cuentas del barrio de un mes en PDF (VEC-TRA-01): los mismos totales de la pantalla. */
export const GET = manejar(async (peticion) => {
  const periodo = new URL(peticion.url).searchParams.get("periodo") ?? undefined;
  const { pdf, nombre } = await cuentasDelBarrioEnPdf(await exigirSesion(peticion), periodo);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${nombre}"`,
      "cache-control": "private, no-store",
    },
  });
});
