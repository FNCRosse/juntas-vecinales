// @HU-GAR-01 @HU-GAR-11 @HU-GAR-25
import { nuevoToken } from "@/compartido/claves";
import type { Transaccion } from "@/compartido/bd/cliente";
import { primerNombre } from "@/compartido/fechas";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { plantillaClaveNueva, plantillaEnlaceAcceso } from "@/compartido/notificaciones/plantillas";
import { MINUTOS_DE_VIGENCIA, type PropositoEnlace, venceEn } from "@/modulos/identidad/dominio/magicLink";
import { guardarEnlace } from "@/modulos/identidad/infraestructura/repositorioEnlaces";

type Destinatario = { id: string; nombreCompleto: string; telefonoWhatsApp: string | null };

const SEGUN_PROPOSITO = {
  ENTRADA: {
    ruta: "/entrar",
    plantilla: plantillaEnlaceAcceso,
    titulo: "Le enviamos su enlace de entrada",
  },
  CLAVE: {
    ruta: "/clave/nueva",
    plantilla: plantillaClaveNueva,
    titulo: "Le enviamos el enlace para crear su clave",
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
  const { ruta, plantilla, titulo } = SEGUN_PROPOSITO[proposito];
  const { token, hash } = nuevoToken();
  await guardarEnlace(tx, {
    usuarioId: usuario.id,
    tokenHash: hash,
    emitidoEn: ahora,
    expiraEn: venceEn(ahora),
    proposito,
  });
  await encolarAviso(
    {
      destinatarioId: usuario.id,
      titulo,
      texto: `Lo enviamos a su WhatsApp. Sirve una sola vez y vence en ${MINUTOS_DE_VIGENCIA} minutos.`,
      whatsapp: usuario.telefonoWhatsApp
        ? {
            telefono: usuario.telefonoWhatsApp,
            ...plantilla(primerNombre(usuario.nombreCompleto), `${origen}${ruta}/${token}`),
          }
        : undefined,
    },
    tx,
  );
}
