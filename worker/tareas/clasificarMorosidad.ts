import { suspenderCasasConAtrasoCritico } from "@/modulos/aportes/aplicacion/morosidad";

/** A las 8 semanas de impago suspende la apertura automática de la reja y avisa a la casa (HU-COB-06). */
export const clasificarMorosidad = () => suspenderCasasConAtrasoCritico();
