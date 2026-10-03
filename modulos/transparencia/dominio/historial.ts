// @HU-ASA-12
// FeedComunitario.historialPublico(): actas y balances juntos, del más nuevo al más antiguo.

/** Por la fecha del evento (la asamblea o la actividad); si coinciden, el publicado más recientemente primero. */
export function ordenarHistorial<T extends { fechaEvento: Date; fechaPublicacion: Date }>(
  registros: readonly T[],
) {
  return [...registros].sort(
    (a, b) =>
      b.fechaEvento.getTime() - a.fechaEvento.getTime() ||
      b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime(),
  );
}
