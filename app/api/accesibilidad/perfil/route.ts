import { z } from "zod";
import { COOKIE_PERFIL } from "@/componentes/a11y/modo";
import { leerJson, manejar } from "@/compartido/manejar";
import { cambiarModoSenior } from "@/modulos/accesibilidad/aplicacion/cambiarModoSenior";
import { COOKIE_SESION, leerCookie, obtenerSesion } from "@/modulos/identidad/aplicacion/sesion";
import { ATRIBUTOS_COOKIE, UN_ANIO_SEGUNDOS } from "@/app/_sesion/sesion";

const esquema = z.object({
  modoSeniorActivo: z.boolean({ error: "Indique si quiere la letra grande: sí o no." }),
});

/** Guarda "Letra grande" en el perfil (HU-ACC-01, ADR-004) y deja el id del perfil en una cookie. */
export const PUT = manejar(async (peticion) => {
  const { modoSeniorActivo } = esquema.parse(await leerJson(peticion));
  // Con sesión se guarda en la cuenta; sin ella, en el perfil de este dispositivo.
  const sesion = await obtenerSesion(leerCookie(peticion, COOKIE_SESION));
  const perfil = await cambiarModoSenior(
    { usuarioId: sesion?.usuarioId, perfilId: leerCookie(peticion, COOKIE_PERFIL) },
    modoSeniorActivo,
  );
  return Response.json(perfil, {
    headers: {
      "set-cookie": `${COOKIE_PERFIL}=${perfil.id}; Max-Age=${UN_ANIO_SEGUNDOS}; ${ATRIBUTOS_COOKIE}`,
    },
  });
});
