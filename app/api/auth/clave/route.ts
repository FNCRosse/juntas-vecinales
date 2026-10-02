import { z } from "zod";
import { leerJson, manejar } from "@/compartido/manejar";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import { COOKIE_SESION } from "@/modulos/identidad/aplicacion/sesion";
import { ATRIBUTOS_COOKIE, inicioSegunRoles, UN_ANIO_SEGUNDOS } from "@/app/_sesion/sesion";

const esquema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "Su DNI tiene 8 números. Revíselo y vuelva a escribirlo."),
  clave: z.string().min(1, "Falta la clave. Péguela desde su gestor o escríbala."),
});

/** Entrar con DNI y clave (equipo y clave de respaldo del vecino). La sesión queda en una cookie. */
export const POST = manejar(async (peticion) => {
  const { token, sesion } = await iniciarSesionConClave(esquema.parse(await leerJson(peticion)));
  return Response.json(
    { destino: inicioSegunRoles(sesion.roles) },
    {
      headers: {
        "set-cookie": `${COOKIE_SESION}=${token}; Max-Age=${UN_ANIO_SEGUNDOS}; ${ATRIBUTOS_COOKIE}`,
      },
    },
  );
});
