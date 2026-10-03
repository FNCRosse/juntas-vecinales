// @HU-ACC-02
// ContenidoAccesible.sintetizarVoz() del diagrama 02f: qué se lee y con qué voz. La síntesis misma la hace
// el navegador (Web Speech API); aquí solo van las decisiones que no dependen de él.

export type VozDisponible = { lang: string; name: string };

const esEspanol = (voz: VozDisponible) => /^es([-_]|$)/i.test(voz.lang);
const esPeruana = (voz: VozDisponible) => /^es[-_]pe$/i.test(voz.lang);

/** La voz es-PE; si el teléfono no la tiene, cualquiera en español; si no hay ninguna, null (no se ofrece el botón). */
export function elegirVoz<T extends VozDisponible>(voces: readonly T[]): T | null {
  return voces.find(esPeruana) ?? voces.find(esEspanol) ?? null;
}

/** Lo que se lee de una noticia: primero si es urgente, luego el título y el mensaje, separados por pausas. */
export function textoParaLeer(noticia: {
  titulo: string;
  cuerpo: string;
  urgencia: "INFORMATIVO" | "URGENTE";
}) {
  return [noticia.urgencia === "URGENTE" ? "Urgente." : null, `${noticia.titulo}.`, noticia.cuerpo]
    .filter(Boolean)
    .join(" ");
}
