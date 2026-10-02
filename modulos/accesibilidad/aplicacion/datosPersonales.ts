// @HU-GAR-12 @HU-GAR-14
import type { SeccionPdf } from "@/compartido/archivos/pdf";
import type { Transaccion } from "@/compartido/bd/cliente";
import { fechaLarga } from "@/compartido/fechas";
import { anonimizarPedidos, solicitudesDe } from "@/modulos/accesibilidad/infraestructura/repositorioApoyo";
import {
  borrarPerfilDe,
  buscarPerfilPorUsuario,
} from "@/modulos/accesibilidad/infraestructura/repositorioPerfiles";

const ESCALAS = { NORMAL: "Normal", GRANDE: "Grande", MUY_GRANDE: "Muy grande" };

/** La sección de accesibilidad de la copia de datos (HU-GAR-12, docs/modulos/identidad: ARCO). */
export async function datosPersonales(usuarioId: string): Promise<SeccionPdf[]> {
  const [perfil, pedidos] = await Promise.all([buscarPerfilPorUsuario(usuarioId), solicitudesDe(usuarioId)]);
  const datos = perfil?.aDatos();
  return [
    {
      titulo: "Accesibilidad y pedidos de ayuda",
      filas: [
        ["Letra grande (modo Senior)", datos?.modoSeniorActivo ? "Activada" : "Desactivada"],
        ["Tamaño de letra", ESCALAS[datos?.escalaTipografica ?? "NORMAL"]],
        ["Lectura en voz alta", datos?.sintesisVozActiva ? "Activada" : "Desactivada"],
        ["Pedidos de ayuda a una persona", String(pedidos.length)],
        ...pedidos.map((p): [string, string] => [
          `Pedido del ${fechaLarga(p.creadaEn)}`,
          `En «${p.pantalla}»`,
        ]),
      ],
    },
  ];
}

/**
 * La parte de accesibilidad de una cancelación aprobada (HU-GAR-14 CA3): la llama `app/` dentro de la
 * transacción de identidad, para que se borre todo o nada.
 */
export async function anonimizar(usuarioId: string, tx: Transaccion) {
  await borrarPerfilDe(tx, usuarioId);
  await anonimizarPedidos(tx, usuarioId, "Persona anonimizada");
}
