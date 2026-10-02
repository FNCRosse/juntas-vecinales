// @HU-GAR-01
import { nuevoToken } from "@/compartido/claves";
import type { Transaccion } from "@/compartido/bd/cliente";
import { primerNombre } from "@/compartido/fechas";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { plantillaEnlaceAcceso } from "@/compartido/notificaciones/plantillas";
import { MINUTOS_DE_VIGENCIA, venceEn } from "@/modulos/identidad/dominio/magicLink";
import { guardarEnlace } from "@/modulos/identidad/infraestructura/repositorioEnlaces";

type Destinatario = { id: string; nombreCompleto: string; telefonoWhatsApp: string | null };

/**
 * Emite un enlace de entrada de un solo uso y lo encola hacia su WhatsApp (R-01). En la BD queda
 * solo el hash; el enlace viaja en la cola hasta enviarse. La copia interna no lo lleva.
 */
export async function emitirEnlace(tx: Transaccion, usuario: Destinatario, origen: string, ahora: Date) {
  const { token, hash } = nuevoToken();
  await guardarEnlace(tx, {
    usuarioId: usuario.id,
    tokenHash: hash,
    emitidoEn: ahora,
    expiraEn: venceEn(ahora),
  });
  await encolarAviso(
    {
      destinatarioId: usuario.id,
      titulo: "Le enviamos su enlace de entrada",
      texto: `Lo enviamos a su WhatsApp. Sirve una sola vez y vence en ${MINUTOS_DE_VIGENCIA} minutos.`,
      whatsapp: usuario.telefonoWhatsApp
        ? {
            telefono: usuario.telefonoWhatsApp,
            ...plantillaEnlaceAcceso(primerNombre(usuario.nombreCompleto), `${origen}/entrar/${token}`),
          }
        : undefined,
    },
    tx,
  );
}
