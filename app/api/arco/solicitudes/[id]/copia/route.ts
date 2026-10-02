import { generarPdf } from "@/compartido/archivos/pdf";
import { fechaYHora } from "@/compartido/fechas";
import { manejar } from "@/compartido/manejar";
import { datosPersonales as datosDeAccesibilidad } from "@/modulos/accesibilidad/aplicacion/datosPersonales";
import { copiaAutorizada, datosPersonales as datosDeIdentidad } from "@/modulos/identidad/aplicacion/arco";
import { exigirSesion } from "@/modulos/identidad/aplicacion/sesion";

/**
 * La copia de los datos personales en PDF (HU-GAR-12): se compone aquí con `datosPersonales` de cada
 * módulo que guarda datos de la persona. Cada módulo nuevo agrega su sección. Solo de quien la pidió.
 */
export const GET = manejar<{ params: Promise<{ id: string }> }>(async (peticion, { params }) => {
  const sesion = await exigirSesion(peticion);
  const { usuarioId, numero, fecha } = await copiaAutorizada(sesion, (await params).id);
  const secciones = [...(await datosDeIdentidad(usuarioId)), ...(await datosDeAccesibilidad(usuarioId))];
  const pdf = await generarPdf({
    titulo: "Mis datos en la Junta Vecinal",
    subtitulos: [
      `Copia de los datos personales de ${sesion.nombreCompleto}.`,
      `Solicitud ${numero}, pedida el ${fecha}; generada el ${fechaYHora(new Date())}`,
    ],
    secciones,
    pie: "Este archivo tiene solo sus datos: no incluye datos de otros vecinos (Ley N.° 29733).",
  });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="mis-datos-${numero}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
});
