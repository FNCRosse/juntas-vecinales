import { z } from "zod";
import { COOKIE_PERFIL } from "@/componentes/a11y/modo";
import { leerJson, manejar } from "@/compartido/manejar";
import { restablecerClave } from "@/modulos/identidad/aplicacion/entradaAlterna";
import { COOKIE_SESION, leerCookie } from "@/modulos/identidad/aplicacion/sesion";
import { ATRIBUTOS_COOKIE, UN_ANIO_SEGUNDOS } from "@/app/_sesion/sesion";

const esquema = z.object({
  token: z.string().regex(/^[\w-]{43}$/, "Este enlace no está completo. Ábralo otra vez desde WhatsApp."),
  clave: z.string().max(200, "La clave es demasiado larga. Use una más corta."),
});

/** Crear la clave nueva con el enlace del WhatsApp (HU-GAR-25 CA3) y entrar. */
export const POST = manejar(async (peticion) => {
  const { token, clave } = esquema.parse(await leerJson(peticion));
  const { token: sesion, destino } = await restablecerClave(token, clave, leerCookie(peticion, COOKIE_PERFIL));
  return Response.json(
    { destino },
    { headers: { "set-cookie": `${COOKIE_SESION}=${sesion}; Max-Age=${UN_ANIO_SEGUNDOS}; ${ATRIBUTOS_COOKIE}` } },
  );
});
