import { z } from "zod";
import { COOKIE_PERFIL } from "@/componentes/a11y/modo";
import { leerJson, manejar } from "@/compartido/manejar";
import { cambiarSintesisVoz } from "@/modulos/accesibilidad/aplicacion/cambiarSintesisVoz";
import { obtenerPerfil } from "@/modulos/accesibilidad/aplicacion/obtenerPerfil";
import { cambiarModoSenior } from "@/modulos/accesibilidad/aplicacion/cambiarModoSenior";
import { COOKIE_SESION, leerCookie, obtenerSesion } from "@/modulos/identidad/aplicacion/sesion";
import { ATRIBUTOS_COOKIE, UN_ANIO_SEGUNDOS } from "@/app/_sesion/sesion";

const MENSAJE_FALTA = "Indique si quiere la letra grande: sí o no.";

// Se cambia una preferencia por vez o las dos: "Letra grande" (HU-ACC-01) y la lectura en voz alta (HU-ACC-02).
const esquema = z
  .object({
    modoSeniorActivo: z.boolean({ error: MENSAJE_FALTA }).optional(),
    sintesisVozActiva: z.boolean({ error: "Indique si quiere la lectura en voz alta: sí o no." }).optional(),
  })
  .refine((c) => c.modoSeniorActivo !== undefined || c.sintesisVozActiva !== undefined, {
    path: ["modoSeniorActivo"],
    error: MENSAJE_FALTA,
  });

/** Guarda "Letra grande" o la lectura en voz alta en el perfil (HU-ACC-01, HU-ACC-02, ADR-004) y deja el id en una cookie. */
export const PUT = manejar(async (peticion) => {
  const { modoSeniorActivo, sintesisVozActiva } = esquema.parse(await leerJson(peticion));
  // Con sesión se guarda en la cuenta; sin ella, en el perfil de este dispositivo.
  const sesion = await obtenerSesion(leerCookie(peticion, COOKIE_SESION));
  const dueno = { usuarioId: sesion?.usuarioId, perfilId: leerCookie(peticion, COOKIE_PERFIL) };
  let perfil = await obtenerPerfil(dueno);
  if (modoSeniorActivo !== undefined) perfil = await cambiarModoSenior(dueno, modoSeniorActivo);
  if (sintesisVozActiva !== undefined) {
    perfil = await cambiarSintesisVoz({ ...dueno, perfilId: perfil.id ?? dueno.perfilId }, sintesisVozActiva);
  }
  return Response.json(perfil, {
    headers: {
      "set-cookie": `${COOKIE_PERFIL}=${perfil.id}; Max-Age=${UN_ANIO_SEGUNDOS}; ${ATRIBUTOS_COOKIE}`,
    },
  });
});
