// @HU-ASA-15
import type { Transaccion } from "@/compartido/bd/cliente";
import { contarPadron } from "@/modulos/identidad/infraestructura/repositorioPadron";
import { idsDeVecinosActivos } from "@/modulos/identidad/infraestructura/repositorioUsuarios";

/** Puerto para M2 y los demás módulos: a quién le llega lo que se publica a toda la comunidad. */
export const vecinosDeLaComunidad = (tx: Transaccion) => idsDeVecinosActivos(tx);

/** Puerto para M4: el total de predios del padrón vigente, base del quórum (un voto por predio, HU-ASA-04). */
export const totalDePredios = async () => (await contarPadron()).predios;
