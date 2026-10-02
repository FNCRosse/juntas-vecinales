import { z } from "zod";
import { COOKIE_PERFIL } from "@/componentes/a11y/modo";
import { ErrorDeAplicacion } from "@/compartido/errores";
import { leerJson, manejar } from "@/compartido/manejar";
import { canjearEnlace } from "@/modulos/identidad/aplicacion/entrarConEnlace";
import { COOKIE_SESION, leerCookie } from "@/modulos/identidad/aplicacion/sesion";
import { ATRIBUTOS_COOKIE, UN_ANIO_SEGUNDOS } from "@/app/_sesion/sesion";

const esquema = z.object({
  token: z.string().regex(/^[\w-]{43}$/, "Este enlace no está completo. Ábralo otra vez desde WhatsApp."),
});

const cookieDeSesion = (token: string) =>
  `${COOKIE_SESION}=${token}; Max-Age=${UN_ANIO_SEGUNDOS}; ${ATRIBUTOS_COOKIE}`;

/**
 * Entrar con el enlace de un solo uso (HU-GAR-02 CA1). Por POST: abrir la página no lo gasta. La
 * página lo envía como JSON; sin script, el formulario llega aquí y se responde con una redirección.
 */
export const POST = manejar(async (peticion) => {
  if (peticion.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
    const token = String((await peticion.formData()).get("token") ?? "");
    try {
      const entrada = await canjearEnlace(
        esquema.parse({ token }).token,
        leerCookie(peticion, COOKIE_PERFIL),
      );
      return new Response(null, {
        status: 303,
        headers: { location: entrada.destino, "set-cookie": cookieDeSesion(entrada.token) },
      });
    } catch (error) {
      if (!(error instanceof ErrorDeAplicacion) && !(error instanceof z.ZodError)) throw error;
      // La página del enlace explica que ya no sirve y cómo seguir.
      return new Response(null, {
        status: 303,
        headers: { location: `/entrar/${encodeURIComponent(token)}` },
      });
    }
  }
  const { token } = esquema.parse(await leerJson(peticion));
  const { token: sesion, destino } = await canjearEnlace(token, leerCookie(peticion, COOKIE_PERFIL));
  return Response.json({ destino }, { headers: { "set-cookie": cookieDeSesion(sesion) } });
});
