// @HU-ACC-04
// CanalMediacionHumana del diagrama 02f: el pedido de ayuda a una persona y su estado de atención.

export type ModoApoyo = "LLAMADA" | "WHATSAPP" | "VISITA";
export type EstadoApoyo = "PENDIENTE" | "EN_ATENCION" | "ATENDIDA";

export const MODOS_APOYO: Record<ModoApoyo, { opcion: string; promesa: string }> = {
  LLAMADA: { opcion: "Que me llamen por teléfono", promesa: "le llamará por teléfono" },
  WHATSAPP: { opcion: "Que me escriban por WhatsApp", promesa: "le escribirá por WhatsApp" },
  VISITA: { opcion: "Que me visiten en mi casa", promesa: "le visitará en su casa" },
};

export const ESTADOS_APOYO: Record<EstadoApoyo, string> = {
  PENDIENTE: "Pendiente",
  EN_ATENCION: "En atención",
  ATENDIDA: "Atendido",
};

const SIGUIENTES: Record<EstadoApoyo, EstadoApoyo[]> = {
  PENDIENTE: ["EN_ATENCION", "ATENDIDA"],
  EN_ATENCION: ["ATENDIDA"],
  ATENDIDA: [],
};

/** El estado solo avanza: pendiente, en atención, atendido (HU-ACC-04 CA3). */
export function puedePasarA(actual: EstadoApoyo, nuevo: EstadoApoyo) {
  return SIGUIENTES[actual].includes(nuevo);
}

/** "A-013": así se nombra el pedido en las pantallas. */
export const numeroDePedido = (numero: number) => `A-${String(numero).padStart(3, "0")}`;

/** Quién puede atender pedidos: la directiva, el mediador y la administración. */
export const ROLES_QUE_ATIENDEN = ["DIRECTIVA", "DIRECTIVO_MEDIADOR", "ADMINISTRADOR"];
