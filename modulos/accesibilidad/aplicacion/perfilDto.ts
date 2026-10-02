import { PerfilAccesibilidad } from "@/modulos/accesibilidad/dominio/perfilAccesibilidad";
import { buscarPerfilPorId } from "@/modulos/accesibilidad/infraestructura/repositorioPerfiles";

/** DTO del perfil: es lo que leen el layout raíz y el switch "Letra grande". */
export type PerfilAccesibilidadDto = {
  id: string | null;
  modoSeniorActivo: boolean;
  escalaTipografica: "NORMAL" | "GRANDE" | "MUY_GRANDE";
  sintesisVozActiva: boolean;
};

export const aDto = (perfil: PerfilAccesibilidad): PerfilAccesibilidadDto => {
  const { id, modoSeniorActivo, escalaTipografica, sintesisVozActiva } = perfil.aDatos();
  return { id, modoSeniorActivo, escalaTipografica, sintesisVozActiva };
};

const esUuid = (texto: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(texto);

/** Perfil guardado por su id o, si no existe, el de por defecto. */
export async function cargarPerfil(perfilId: string | undefined) {
  return (
    (perfilId && esUuid(perfilId) && (await buscarPerfilPorId(perfilId))) || PerfilAccesibilidad.porDefecto()
  );
}
