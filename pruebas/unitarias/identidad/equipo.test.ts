import {
  conRolDeEquipo,
  conRolesDeDirectiva,
  diferenciaDePermisos,
  diferenciaDeRoles,
  rolDeEquipo,
  rolesDeDirectiva,
  textoDeRoles,
} from "@/modulos/identidad/dominio/equipo";

describe("@HU-GAR-23 Roles de directiva en la cuenta de administración", () => {
  it("@HU-GAR-23 CA1 una cuenta con ADMINISTRADOR puede sumar o quitar roles de directiva sin perder los demás", () => {
    const base = ["ADMINISTRADOR", "VECINO"] as const;
    expect(conRolesDeDirectiva([...base], ["DIRECTIVA"])).toEqual(["ADMINISTRADOR", "VECINO", "DIRECTIVA"]);
    expect(conRolesDeDirectiva([...base], ["DIRECTIVO_MEDIADOR", "DIRECTIVA"])).toEqual([
      "ADMINISTRADOR",
      "VECINO",
      "DIRECTIVA",
      "DIRECTIVO_MEDIADOR",
    ]);
    expect(
      conRolesDeDirectiva(["ADMINISTRADOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"], ["DIRECTIVO_MEDIADOR"]),
    ).toEqual(["ADMINISTRADOR", "DIRECTIVO_MEDIADOR"]);
    expect(conRolesDeDirectiva(["ADMINISTRADOR", "DIRECTIVA"], [])).toEqual(["ADMINISTRADOR"]);
  });

  it("@HU-GAR-23 CA1 no repite un rol y nunca toca al vigilante", () => {
    expect(conRolesDeDirectiva(["ADMINISTRADOR"], ["DIRECTIVA", "DIRECTIVA"])).toEqual([
      "ADMINISTRADOR",
      "DIRECTIVA",
    ]);
    expect(conRolesDeDirectiva(["ADMINISTRADOR", "VIGILANTE"], [])).toEqual(["ADMINISTRADOR", "VIGILANTE"]);
  });

  it("@HU-GAR-23 CA1 lee solo los roles de directiva de la cuenta", () => {
    expect(rolesDeDirectiva(["ADMINISTRADOR", "VECINO", "DIRECTIVO_MEDIADOR"])).toEqual([
      "DIRECTIVO_MEDIADOR",
    ]);
    expect(rolesDeDirectiva(["ADMINISTRADOR"])).toEqual([]);
  });

  it("@HU-GAR-23 CA1 los usos de un solo rol de equipo siguen igual con la cuenta de administración", () => {
    expect(rolDeEquipo(["ADMINISTRADOR"])).toBeNull();
    expect(rolDeEquipo(["ADMINISTRADOR", "DIRECTIVA"])).toBe("DIRECTIVA");
    // Dar de baja a quien vive en el barrio le quita el equipo pero no la administración.
    expect(conRolDeEquipo(["ADMINISTRADOR", "DIRECTIVA"], null)).toEqual(["ADMINISTRADOR"]);
  });

  it("@HU-GAR-23 CA2 qué gana y qué pierde al cambiar el conjunto de roles", () => {
    expect(diferenciaDeRoles([], ["DIRECTIVO_MEDIADOR"])).toEqual({
      gana: ["Registrar por un vecino y atender pedidos de ayuda"],
      pierde: [],
      mantiene: [],
    });
    const completa = diferenciaDeRoles(["DIRECTIVO_MEDIADOR"], ["DIRECTIVA", "DIRECTIVO_MEDIADOR"]);
    expect(completa.gana).toHaveLength(4);
    expect(completa.pierde).toEqual([]);
    expect(completa.mantiene).toEqual(["Registrar por un vecino y atender pedidos de ayuda"]);
    expect(diferenciaDeRoles(["DIRECTIVA"], [])).toMatchObject({ gana: [], mantiene: [] });
    // El cambio de un solo rol por otro usa la misma cuenta.
    expect(diferenciaDePermisos("DIRECTIVA", "DIRECTIVO_MEDIADOR")).toEqual(
      diferenciaDeRoles(["DIRECTIVA"], ["DIRECTIVO_MEDIADOR"]),
    );
  });

  it("@HU-GAR-23 CA2 nombra los roles en lenguaje llano", () => {
    expect(textoDeRoles(["ADMINISTRADOR"])).toBe("Administración");
    expect(textoDeRoles(["ADMINISTRADOR", "DIRECTIVA"])).toBe("Administración y Directiva");
    expect(textoDeRoles(["ADMINISTRADOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"])).toBe(
      "Administración, Directiva y Directivo mediador",
    );
  });
});
