// @HU-ASA-04
// Quórum proyectado: las confirmaciones (digitales y asistidas) frente al padrón, un voto por predio. El
// mínimo lo fija la regla del 50 % + 1 al convocar (convocatoria.ts); aquí solo se mide cuánto falta.

export type QuorumProyectado = {
  digital: number;
  asistida: number;
  confirmados: number;
  padronTotal: number;
  requerido: number;
  faltan: number;
  porcentaje: number;
  alcanza: boolean;
};

export function proyectarQuorum(datos: {
  padronTotal: number;
  requerido: number;
  digital: number;
  asistida: number;
}): QuorumProyectado {
  const confirmados = datos.digital + datos.asistida;
  return {
    ...datos,
    confirmados,
    faltan: Math.max(0, datos.requerido - confirmados),
    porcentaje: datos.padronTotal > 0 ? Math.round((confirmados / datos.padronTotal) * 100) : 0,
    alcanza: confirmados >= datos.requerido,
  };
}

/** La frase del prototipo bajo la barra («Faltan 13 casas para el mínimo (61)»). */
export function textoDelQuorum({ alcanza, faltan, requerido }: QuorumProyectado): string {
  if (alcanza) return `Se llegó al mínimo de ${requerido} casas.`;
  return `${faltan === 1 ? "Falta 1 casa" : `Faltan ${faltan} casas`} para el mínimo (${requerido}).`;
}
