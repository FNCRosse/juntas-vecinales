import { descargarSiPuede } from "@/compartido/archivos/registro";
import { manejar } from "@/compartido/manejar";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";
import { USOS } from "../usos";

/** Quién puede ver un archivo: quien lo subió y los roles que su uso deja ver; nadie más (AC-7). */
export const GET = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { url } = await descargarSiPuede(
    (await params).id,
    (a) =>
      a.subidoPor === sesion.usuarioId ||
      sesion.roles.some((rol) =>
        (USOS[a.uso as keyof typeof USOS]?.ven as readonly string[] | undefined)?.includes(rol),
      ),
  );
  return new Response(null, {
    status: 302,
    headers: { location: url, "cache-control": "private, no-store" },
  });
});
