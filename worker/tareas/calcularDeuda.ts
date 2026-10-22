import { calcularDeuda as calcular } from "@/modulos/aportes/aplicacion/deuda";

/** Cada lunes emite la cuota de la semana de cada casa y avisa a sus vecinos (HU-COB-01). */
export const calcularDeuda = () => calcular();
