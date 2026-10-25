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
  "Asambleas",
  "Cobros",
] as const;
export type ModuloAuditoria = (typeof MODULOS_AUDITORIA)[number] | "Otros";

export const ACCIONES: Record<string, { modulo: ModuloAuditoria; texto: string }> = {
  empadronar: { modulo: "Padrón", texto: "Empadronó una vivienda" },
  actualizar_predio: { modulo: "Padrón", texto: "Actualizó los datos de un predio" },
  dar_de_baja_residente: { modulo: "Padrón", texto: "Dio de baja a un residente" },
  dar_acceso_equipo: { modulo: "Equipo", texto: "Dio acceso de equipo" },
  generar_enlace_equipo: { modulo: "Equipo", texto: "Generó un enlace de invitación para copiar" },
  crear_acceso_equipo: { modulo: "Equipo", texto: "Creó su acceso de equipo" },
  cambiar_rol: { modulo: "Equipo", texto: "Cambió un rol del equipo" },
  cambiar_roles: { modulo: "Equipo", texto: "Cambió los roles de una cuenta de administración" },
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
  exportar_recaudacion: { modulo: "Transparencia", texto: "Exportó la recaudación a un archivo" },
  publicar_convocatoria: { modulo: "Asambleas", texto: "Publicó la convocatoria a una asamblea" },
  confirmar_asistencia: { modulo: "Asambleas", texto: "Confirmó la asistencia de una casa a la asamblea" },
  cancelar_asistencia: { modulo: "Asambleas", texto: "Canceló la asistencia de una casa a la asamblea" },
  registrar_asistencia_asistida: {
    modulo: "Asambleas",
    texto: "Registró la asistencia de un vecino como mediador",
  },
  anular_asistencia_asistida: {
    modulo: "Asambleas",
    texto: "Anuló una asistencia registrada por el mediador",
  },
  avisar_corte_de_quorum: { modulo: "Asambleas", texto: "Avisó a la directiva cómo va el quórum" },
  delegar_voto: { modulo: "Asambleas", texto: "Registró una delegación de voto" },
  anular_delegacion: { modulo: "Asambleas", texto: "Anuló una delegación de voto" },
  marcar_presente: { modulo: "Asambleas", texto: "Marcó a una casa como presente en la asamblea" },
  validar_poder: { modulo: "Asambleas", texto: "Validó un poder de voto en la puerta" },
  abrir_votaciones: { modulo: "Asambleas", texto: "Abrió las votaciones de una asamblea" },
  proponer_tema: { modulo: "Asambleas", texto: "Propuso un tema para la agenda" },
  decidir_propuesta: { modulo: "Asambleas", texto: "Decidió sobre una propuesta de agenda" },
  reabrir_propuesta: { modulo: "Asambleas", texto: "Cambió su decisión sobre una propuesta de agenda" },
  publicar_actividad: { modulo: "Asambleas", texto: "Publicó una actividad pro fondos" },
  colaborar_con_actividad: { modulo: "Asambleas", texto: "Eligió su aporte a una actividad pro fondos" },
  adjuntar_comprobante_aporte: { modulo: "Asambleas", texto: "Adjuntó el comprobante de un aporte" },
  ofrecer_ayuda: { modulo: "Asambleas", texto: "Ofreció su ayuda como voluntario" },
  evaluar_voluntariado: { modulo: "Asambleas", texto: "Evaluó un ofrecimiento de voluntariado" },
  cambiar_tarifa: { modulo: "Cobros", texto: "Programó un cambio de tarifa" },
  registrar_pago_digital: { modulo: "Cobros", texto: "Mandó el pago de su casa con un comprobante" },
  aprobar_pago: { modulo: "Cobros", texto: "Aprobó un pago" },
  observar_pago: { modulo: "Cobros", texto: "Observó un comprobante de pago" },
  reenviar_comprobante: { modulo: "Cobros", texto: "Mandó otra foto de un pago observado" },
  enviar_recibo: { modulo: "Cobros", texto: "Envió un recibo a la app de la casa" },
  confirmar_recibo: { modulo: "Cobros", texto: "Confirmó que recibió su recibo" },
  pedir_recibo_papel: { modulo: "Cobros", texto: "Pidió su recibo en papel" },
  entregar_recibo_papel: { modulo: "Cobros", texto: "Entregó un recibo en papel" },
  pedir_cobro_en_casa: { modulo: "Cobros", texto: "Pidió que vayan a cobrarle en efectivo" },
  cancelar_cobro_en_casa: { modulo: "Cobros", texto: "Canceló su pedido de cobro en casa" },
  registrar_cobro_en_efectivo: { modulo: "Cobros", texto: "Registró un cobro en efectivo" },
  liquidar_deuda: { modulo: "Cobros", texto: "Registró el pago total de una deuda acumulada" },
  registrar_reclamo: { modulo: "Cobros", texto: "Reclamó el monto de su cuota" },
  aprobar_reclamo: { modulo: "Cobros", texto: "Aprobó el ajuste de la cuota de una casa" },
  mantener_cuota_por_reclamo: { modulo: "Cobros", texto: "Mantuvo la cuota de una casa tras su reclamo" },
  alertar_morosidad: { modulo: "Cobros", texto: "Envió recordatorios amables de cuota" },
  clasificar_morosidad: {
    modulo: "Cobros",
    texto: "Suspendió la apertura automática de una casa por atraso",
  },
  calcular_deuda: { modulo: "Cobros", texto: "Emitió las cuotas de la semana" },
  registrar_queja: { modulo: "Incidentes", texto: "Registró un reporte vecinal" },
  admitir_queja: { modulo: "Incidentes", texto: "Admitió un reporte vecinal" },
  resolver_queja: { modulo: "Incidentes", texto: "Cerró un reporte como resuelto" },
  derivar_queja: { modulo: "Incidentes", texto: "Derivó un reporte a una entidad externa" },
  rechazar_queja: { modulo: "Incidentes", texto: "Rechazó un reporte vecinal" },
  registrar_queja_asistida: { modulo: "Incidentes", texto: "Registró un reporte por un vecino" },
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
