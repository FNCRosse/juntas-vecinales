// @HU-ASA-15
import type { Transaccion } from "@/compartido/bd/cliente";
import { idsDeVecinosActivos } from "@/modulos/identidad/infraestructura/repositorioUsuarios";

/** Puerto para M2 y los demás módulos: a quién le llega lo que se publica a toda la comunidad. */
export const vecinosDeLaComunidad = (tx: Transaccion) => idsDeVecinosActivos(tx);
