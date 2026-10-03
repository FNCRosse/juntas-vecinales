// Catálogo de acciones auditadas (HU-GAR-26 CA1 y CA2): de qué módulo viene cada una y cómo se lee en
// la auditoría global. Cada módulo agrega aquí las acciones que registra.

/** Actor de una acción hecha en modo anónimo (queja anónima, HU-QUE-02): nunca se guarda quién fue. */
export const ACTOR_ANONIMO = "ANONIMO";

export const MODULOS_AUDITORIA = [
  "Padrón",
  "Equipo",
  "Acceso",
  "Garita",
  "Privacidad",
  "Transparencia",
  "Incidentes",
] as const;
export type ModuloAuditoria = (typeof MODULOS_AUDITORIA)[number] | "Otros";

export const ACCIONES: Record<string, { modulo: ModuloAuditoria; texto: string }> = {
  empadronar: { modulo: "Padrón", texto: "Empadronó una vivienda" },
  actualizar_predio: { modulo: "Padrón", texto: "Actualizó los datos de un predio" },
  dar_de_baja_residente: { modulo: "Padrón", texto: "Dio de baja a un residente" },
  dar_acceso_equipo: { modulo: "Equipo", texto: "Dio acceso de equipo" },
  crear_acceso_equipo: { modulo: "Equipo", texto: "Creó su acceso de equipo" },
  cambiar_rol: { modulo: "Equipo", texto: "Cambió un rol del equipo" },
  quitar_acceso_equipo: { modulo: "Equipo", texto: "Quitó un acceso de equipo" },
  reenviar_enlace: { modulo: "Acceso", texto: "Reenvió un enlace de entrada" },
  crear_clave_respaldo: { modulo: "Acceso", texto: "Creó su clave de respaldo" },
  restablecer_clave_respaldo: { modulo: "Acceso", texto: "Creó una clave nueva" },
  abrir_por_emergencia: { modulo: "Garita", texto: "Abrió la reja por una emergencia" },
  aceptar_politica: { modulo: "Privacidad", texto: "Aceptó la política de privacidad" },
  descargar_copia_datos: { modulo: "Privacidad", texto: "Descargó la copia de sus datos" },
  aprobar_arco: { modulo: "Privacidad", texto: "Aprobó una solicitud de privacidad" },
  rechazar_arco: { modulo: "Privacidad", texto: "Rechazó una solicitud de privacidad" },
  publicar_acta: { modulo: "Transparencia", texto: "Publicó un acta de asamblea" },
  publicar_balance: { modulo: "Transparencia", texto: "Publicó el balance de una actividad" },
  publicar_comunicado: { modulo: "Transparencia", texto: "Publicó un comunicado" },
  registrar_queja: { modulo: "Incidentes", texto: "Registró un reporte vecinal" },
  oponerse_ubicacion_exacta: { modulo: "Privacidad", texto: "Pidió no mostrar su ubicación exacta" },
  retirar_oposicion_ubicacion: { modulo: "Privacidad", texto: "Volvió a mostrar su ubicación exacta" },
};

/** Una acción que todavía no está en el catálogo se muestra igual, en palabras y en "Otros". */
export function describirAccion(accion: string) {
  return ACCIONES[accion] ?? { modulo: "Otros" as const, texto: accion.replaceAll("_", " ") };
}

export const accionesDelModulo = (modulo: ModuloAuditoria) =>
  Object.entries(ACCIONES)
    .filter(([, a]) => a.modulo === modulo)
    .map(([accion]) => accion);
