// @HU-GAR-21 @HU-GAR-22 @HU-GAR-23
// Roles del equipo y sus permisos (prototipo ADM-EQU-01). La autorización real la hace cada caso de
// uso con exigirRol; esta lista es la que se muestra para que el administrador sepa qué da cada rol.

export type RolEquipo = "DIRECTIVA" | "DIRECTIVO_MEDIADOR" | "VIGILANTE";
type NombreRol = RolEquipo | "VECINO" | "VECINO_ADULTO_MAYOR" | "ADMINISTRADOR";

export const ROLES_EQUIPO: RolEquipo[] = ["DIRECTIVA", "DIRECTIVO_MEDIADOR", "VIGILANTE"];

/** Los roles que la cuenta de administración puede sumarse en la misma cuenta (HU-GAR-23). */
export type RolDeDirectiva = "DIRECTIVA" | "DIRECTIVO_MEDIADOR";
export const ROLES_DE_DIRECTIVA: RolDeDirectiva[] = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"];

export const NOMBRE_ROL: Record<RolEquipo | "ADMINISTRADOR", string> = {
  DIRECTIVA: "Directiva",
  DIRECTIVO_MEDIADOR: "Directivo mediador",
  VIGILANTE: "Vigilante",
  ADMINISTRADOR: "Administración",
};

export const PERMISOS = [
  "Revisar pagos, cobrar en efectivo y emitir recibos",
  "Cambiar la tarifa de la cuota",
  "Convocar asambleas, pasar lista y publicar actas",
  "Evaluar, resolver y derivar incidentes",
  "Registrar por un vecino y atender pedidos de ayuda",
  "Ver placas, DNI y bitácora para el control de garita",
] as const;
export type Permiso = (typeof PERMISOS)[number];

export const PERMISOS_POR_ROL: Record<RolEquipo, Permiso[]> = {
  DIRECTIVA: PERMISOS.slice(0, 5),
  DIRECTIVO_MEDIADOR: [PERMISOS[4]],
  VIGILANTE: [PERMISOS[5]],
};

/** Qué gana, qué pierde y qué mantiene al pasar de unos roles a otros (HU-GAR-23 CA2). */
export function diferenciaDeRoles(actuales: RolEquipo[], nuevos: RolEquipo[]) {
  const antes = actuales.flatMap((rol) => PERMISOS_POR_ROL[rol]);
  const despues = PERMISOS.filter((p) => nuevos.some((rol) => PERMISOS_POR_ROL[rol].includes(p)));
  return {
    gana: despues.filter((p) => !antes.includes(p)),
    pierde: antes.filter((p) => !despues.includes(p)),
    mantiene: despues.filter((p) => antes.includes(p)),
  };
}

export const diferenciaDePermisos = (actual: RolEquipo, nuevo: RolEquipo) =>
  diferenciaDeRoles([actual], [nuevo]);

/** El rol de equipo de una cuenta, si tiene uno (un solo rol de equipo por persona; la cuenta de administración además puede sumar los de directiva, ver rolesDeDirectiva). */
export function rolDeEquipo(roles: NombreRol[]): RolEquipo | null {
  return ROLES_EQUIPO.find((rol) => roles.includes(rol)) ?? null;
}

/** Cambia el rol de equipo y deja los demás (vecino) como estaban. */
export function conRolDeEquipo(roles: NombreRol[], nuevo: RolEquipo | null): NombreRol[] {
  const sinEquipo = roles.filter((rol) => !(ROLES_EQUIPO as NombreRol[]).includes(rol));
  return nuevo ? [...sinEquipo, nuevo] : sinEquipo;
}

/** Los roles de directiva de una cuenta, en el orden de ROLES_DE_DIRECTIVA. */
export function rolesDeDirectiva(roles: NombreRol[]): RolDeDirectiva[] {
  return ROLES_DE_DIRECTIVA.filter((rol) => roles.includes(rol));
}

/** Pone exactamente estos roles de directiva y deja los demás (administración, vecino) como estaban. */
export function conRolesDeDirectiva(roles: NombreRol[], nuevos: RolDeDirectiva[]): NombreRol[] {
  const resto = roles.filter((rol) => !(ROLES_DE_DIRECTIVA as NombreRol[]).includes(rol));
  return [...resto, ...ROLES_DE_DIRECTIVA.filter((rol) => nuevos.includes(rol))];
}

/** «Administración, Directiva y Directivo mediador»: los roles de equipo de una cuenta en lenguaje llano. */
export function textoDeRoles(roles: NombreRol[]): string {
  const nombres = [
    ...(roles.includes("ADMINISTRADOR") ? [NOMBRE_ROL.ADMINISTRADOR] : []),
    ...ROLES_EQUIPO.filter((rol) => roles.includes(rol)).map((rol) => NOMBRE_ROL[rol]),
  ];
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}` : (nombres[0] ?? "");
}

/** La clave de equipo es más larga que la de respaldo del vecino (prototipo ADM-ENT-02). */
export const LARGO_MINIMO_CLAVE_EQUIPO = 12;

/** La invitación para crear el acceso de equipo vence en 48 horas (prototipo ADM-EQU-03). */
export const HORAS_INVITACION = 48;

export const MOTIVOS_BAJA = {
  CARGO: "Dejó su cargo en la junta",
  CONTRATO: "Terminó su contrato",
  OTRO: "Otro motivo",
} as const;
export type MotivoBaja = keyof typeof MOTIVOS_BAJA;
