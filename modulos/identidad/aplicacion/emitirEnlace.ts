// @HU-GAR-01 @HU-GAR-11 @HU-GAR-25
import { nuevoToken } from "@/compartido/claves";
import type { Transaccion } from "@/compartido/bd/cliente";
import { primerNombre } from "@/compartido/fechas";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import {
  plantillaClaveNueva,
  plantillaEnlaceAcceso,
  plantillaInvitacionEquipo,
} from "@/compartido/notificaciones/plantillas";
import { HORAS_INVITACION, NOMBRE_ROL, rolDeEquipo } from "@/modulos/identidad/dominio/equipo";
import { MINUTOS_DE_VIGENCIA, type PropositoEnlace, venceEn } from "@/modulos/identidad/dominio/magicLink";
import { guardarEnlace } from "@/modulos/identidad/infraestructura/repositorioEnlaces";
import type { NombreRol } from "./sesion";

type Destinatario = {
  id: string;
  nombreCompleto: string;
  telefonoWhatsApp: string | null;
  roles?: NombreRol[];
};

const SEGUN_PROPOSITO: Record<
  PropositoEnlace,
  {
    ruta: string;
    titulo: string;
    vence: string;
    plantilla: (u: Destinatario, enlace: string) => { plantilla: string; parametros: string[] };
  }
> = {
  ENTRADA: {
    ruta: "/entrar",
    titulo: "Le enviamos su enlace de entrada",
    vence: `${MINUTOS_DE_VIGENCIA} minutos`,
    plantilla: (u, enlace) => plantillaEnlaceAcceso(primerNombre(u.nombreCompleto), enlace),
  },
  CLAVE: {
    ruta: "/clave/nueva",
    titulo: "Le enviamos el enlace para crear su clave",
    vence: `${MINUTOS_DE_VIGENCIA} minutos`,
    plantilla: (u, enlace) => plantillaClaveNueva(primerNombre(u.nombreCompleto), enlace),
  },
  EQUIPO: {
    ruta: "/entrar/equipo/crear",
    titulo: "Le enviamos su invitación al equipo",
    vence: `${HORAS_INVITACION} horas`,
    plantilla: (u, enlace) => {
      const rol = rolDeEquipo(u.roles ?? []);
      return plantillaInvitacionEquipo(
        primerNombre(u.nombreCompleto),
        rol ? NOMBRE_ROL[rol] : "parte del equipo",
        enlace,
      );
    },
  },
};

/**
 * Emite un enlace de un solo uso, anula el anterior del mismo tipo y lo encola hacia su WhatsApp
 * (R-01). En la BD queda solo el hash; el enlace viaja en la cola hasta enviarse. La copia interna
 * no lo lleva.
 */
export async function emitirEnlace(
  tx: Transaccion,
  usuario: Destinatario,
  origen: string,
  ahora: Date,
  proposito: PropositoEnlace = "ENTRADA",
) {
  const { ruta, plantilla, titulo, vence } = SEGUN_PROPOSITO[proposito];
  const { token, hash } = nuevoToken();
  await guardarEnlace(tx, {
    usuarioId: usuario.id,
    tokenHash: hash,
    emitidoEn: ahora,
    expiraEn: venceEn(ahora, proposito),
    proposito,
  });
  await encolarAviso(
    {
      destinatarioId: usuario.id,
      titulo,
      texto: `Lo enviamos a su WhatsApp. Sirve una sola vez y vence en ${vence}.`,
      whatsapp: usuario.telefonoWhatsApp
        ? {
            telefono: usuario.telefonoWhatsApp,
            ...plantilla(usuario, `${origen}${ruta}/${token}`),
          }
        : undefined,
    },
    tx,
  );
}
