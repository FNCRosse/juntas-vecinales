import { manejar } from "@/compartido/manejar";
import { auditoriaGlobal } from "@/modulos/identidad/aplicacion/auditoria";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/** La auditoría global, solo lectura, con filtros por módulo, acción y responsable (HU-GAR-26). */
export const GET = manejar(async (peticion) => {
  const sesion = await exigirSesion(peticion);
  const p = new URL(peticion.url).searchParams;
  return Response.json(
    await auditoriaGlobal(sesion, {
      modulo: p.get("modulo") ?? undefined,
      accion: p.get("accion") ?? undefined,
      responsable: p.get("responsable") ?? undefined,
      antes: p.get("antes") ?? undefined,
    }),
  );
});
