import { z } from "zod";
import { COOKIE_PERFIL } from "@/componentes/a11y/modo";
import { leerJson, manejar } from "@/compartido/manejar";
import { cambiarModoSenior } from "@/modulos/accesibilidad/aplicacion/cambiarModoSenior";

const esquema = z.object({
  modoSeniorActivo: z.boolean({ error: "Indique si quiere la letra grande: sí o no." }),
});

const UN_ANIO_SEGUNDOS = 400 * 24 * 60 * 60;

function leerCookie(peticion: Request, nombre: string) {
  const par = peticion.headers
    .get("cookie")
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${nombre}=`));
  return par?.slice(nombre.length + 1);
}

/** Guarda "Letra grande" en el perfil (HU-ACC-01, ADR-004) y deja el id del perfil en una cookie. */
export const PUT = manejar(async (peticion) => {
  const { modoSeniorActivo } = esquema.parse(await leerJson(peticion));
  const perfil = await cambiarModoSenior(leerCookie(peticion, COOKIE_PERFIL), modoSeniorActivo);
  return Response.json(perfil, {
    headers: {
      "set-cookie": `${COOKIE_PERFIL}=${perfil.id}; Path=/; Max-Age=${UN_ANIO_SEGUNDOS}; HttpOnly; Secure; SameSite=Lax`,
    },
  });
});
