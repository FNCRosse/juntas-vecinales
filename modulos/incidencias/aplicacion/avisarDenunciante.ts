// @HU-QUE-05 @HU-QUE-09
import type { Transaccion } from "@/compartido/bd/cliente";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { plantillaNovedadReporte } from "@/compartido/notificaciones/plantillas";
import { telefonoDe } from "@/modulos/identidad/aplicacion/barrio";
import { descifrar } from "@/modulos/incidencias/infraestructura/identidadProtegida";

/**
 * Avisa a quien reportó cada cambio de estado (HU-QUE-09 CA2), en la transacción del cambio (ADR-006).
 * Si es anónimo, se descifra su id solo para esto y el aviso no lleva código ni detalle (R-09).
 */
export async function avisarAlDenunciante(
  queja: { denuncianteId: string | null; identidadProtegida: { datosCifrados: string } | null },
  aviso: { titulo: string; texto: string },
  tx: Transaccion,
) {
  const anonima = !queja.denuncianteId;
  const destinatarioId =
    queja.denuncianteId ?? (queja.identidadProtegida && descifrar(queja.identidadProtegida.datosCifrados));
  if (!destinatarioId) return;
  const telefono = await telefonoDe(destinatarioId);
  await encolarAviso(
    {
      destinatarioId,
      tipo: "REPORTES",
      ...(anonima
        ? {
            titulo: "Hay novedades en su reporte anónimo",
            texto: "Consúltelo con su código de seguimiento, en Incidentes.",
          }
        : aviso),
      whatsapp: telefono ? { telefono, ...plantillaNovedadReporte() } : undefined,
    },
    tx,
  );
}
