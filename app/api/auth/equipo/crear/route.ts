import { z } from "zod";
import { COOKIE_PERFIL } from "@/componentes/a11y/modo";
import { leerJson, manejar } from "@/compartido/manejar";
import { crearAccesoEquipo } from "@/modulos/identidad/aplicacion/equipo";
import { COOKIE_SESION, leerCookie } from "@/modulos/identidad/aplicacion/sesion";
import { ATRIBUTOS_COOKIE, inicioSegunRoles, UN_ANIO_SEGUNDOS } from "@/app/_sesion/sesion";

const esquema = z.object({
  token: z.string().regex(/^[\w-]{43}$/, "Esta invitación no está completa. Ábrala otra vez desde WhatsApp."),
  clave: z.string().max(200, "La clave es demasiado larga. Use una más corta."),
});

/** Crear el acceso de equipo con la invitación y entrar (HU-GAR-21 CA2, ADM-ENT-02). */
export const POST = manejar(async (peticion) => {
  const { token, clave } = esquema.parse(await leerJson(peticion));
  const { token: sesion, sesion: datos } = await crearAccesoEquipo(
    token,
    clave,
    leerCookie(peticion, COOKIE_PERFIL),
  );
  return Response.json(
    { destino: inicioSegunRoles(datos.roles) },
    {
      headers: {
        "set-cookie": `${COOKIE_SESION}=${sesion}; Max-Age=${UN_ANIO_SEGUNDOS}; ${ATRIBUTOS_COOKIE}`,
      },
    },
  );
});
