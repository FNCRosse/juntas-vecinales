// @HU-GAR-12 @HU-GAR-14
import type { SeccionPdf } from "@/compartido/archivos/pdf";
import type { Transaccion } from "@/compartido/bd/cliente";
import { soles } from "@/compartido/dinero";
import { fechaLarga } from "@/compartido/fechas";
import { predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { CONDICION_EN_TEXTO } from "@/modulos/asambleas/dominio/delegacion";
import { anonimizarDe, datosDe } from "@/modulos/asambleas/infraestructura/repositorioArco";

type Fila = [string, string];

const PROPUESTA = {
  PENDIENTE_REVISION: "Pendiente de revisión",
  INCLUIDA: "Incluida en la agenda",
  NO_INCLUIDA: "No incluida",
};
const COLABORACION = { POR_REVISAR: "Por revisar", AGENDADA: "Agendada para el cobro" };
const VOLUNTARIADO = { PENDIENTE: "Pendiente", APROBADO: "Aprobado", NO_APROBADO: "No aprobado" };

const cuando = (c: { titulo: string; fechaHora: Date }) => `«${c.titulo}» del ${fechaLarga(c.fechaHora)}`;

/**
 * La sección de asambleas de la copia de datos (HU-GAR-12 CA1): la asistencia de su casa, los poderes que dio, y
 * lo que propuso, aportó u ofreció. Del apoderado solo se muestra lo que la persona misma escribió.
 */
export async function datosPersonales(usuarioId: string): Promise<SeccionPdf[]> {
  const predio = await predioDelVecino(usuarioId);
  const d = await datosDe(usuarioId, predio?.id ?? null);
  const filas: Fila[] = [
    ...d.confirmaciones.map((c): Fila => [
      `Asistencia a ${cuando(c.convocatoria)}`,
      c.modo === "ASISTIDA" ? "Confirmada por un mediador" : "Confirmada por la casa",
    ]),
    ...d.delegaciones.map((c): Fila => [
      `Poder para ${cuando(c.convocatoria)}`,
      `${c.apoderadoNombre}, ${CONDICION_EN_TEXTO[c.condicion]} · DNI terminado en ${c.apoderadoDniFinal}`,
    ]),
    ...d.propuestas.map((c): Fila => [
      `Propuesta para ${cuando(c.convocatoria)}`,
      `«${c.titulo}» · ${PROPUESTA[c.estado]}`,
    ]),
    ...d.colaboraciones.map((c): Fila => [
      `Aporte a ${cuando(c.convocatoria)}`,
      `${c.cantidad} · ${soles(c.monto)} · ${COLABORACION[c.estado]}`,
    ]),
    ...d.voluntariados.map((c): Fila => [
      `Voluntariado en ${cuando(c.convocatoria)}`,
      `«${c.descripcion}»${c.rolAsignado ? ` · rol: ${c.rolAsignado}` : ""} · ${VOLUNTARIADO[c.estado]}`,
    ]),
  ];
  return [
    {
      titulo: "Asambleas y actividades",
      filas: filas.length ? filas : [["Asambleas y actividades", "No tiene registros."]],
    },
  ];
}

/** La parte de asambleas de una cancelación aprobada (HU-GAR-14 CA3), en la transacción de identidad. */
export async function anonimizar(usuarioId: string, tx: Transaccion) {
  await anonimizarDe(tx, usuarioId);
}
