import { avisarCorteDeQuorum } from "@/modulos/asambleas/aplicacion/quorum";

/** Al llegar el plazo de corte avisa a la directiva si el quórum proyectado alcanza (HU-ASA-04 CA3). */
export const avisarCorteQuorum = () => avisarCorteDeQuorum();
