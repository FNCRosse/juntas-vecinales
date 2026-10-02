import { PerfilAccesibilidad } from "@/modulos/accesibilidad/dominio/perfilAccesibilidad";

describe("@HU-ACC-01 PerfilAccesibilidad", () => {
  it("@HU-ACC-01 sin perfil guardado se usa el modo Normal, con la confirmación en dos pasos activa", () => {
    expect(PerfilAccesibilidad.porDefecto().aDatos()).toEqual({
      id: null,
      usuarioId: null,
      modoSeniorActivo: false,
      escalaTipografica: "NORMAL",
      altoContrasteActivo: false,
      sintesisVozActiva: false,
      confirmacionEnDosPasosActiva: true,
      areaTactilAmpliada: false,
    });
  });

  it("@HU-ACC-01 CA2 activar el modo Senior sube la escala, el contraste y el área táctil; desactivarlo los devuelve", () => {
    const perfil = PerfilAccesibilidad.porDefecto("usuario-1");
    perfil.activarModoSenior();
    expect(perfil.modoSeniorActivo).toBe(true);
    expect(perfil.aDatos()).toMatchObject({
      escalaTipografica: "GRANDE",
      altoContrasteActivo: true,
      areaTactilAmpliada: true,
      usuarioId: "usuario-1",
    });
    perfil.desactivarModoSenior();
    expect(perfil.aDatos()).toMatchObject({
      modoSeniorActivo: false,
      escalaTipografica: "NORMAL",
      areaTactilAmpliada: false,
    });
  });

  it("@HU-ACC-03 la confirmación en dos pasos no se puede desactivar", () => {
    const datos = { ...PerfilAccesibilidad.porDefecto().aDatos(), confirmacionEnDosPasosActiva: false };
    expect(() => PerfilAccesibilidad.reconstruir(datos)).toThrow("no se puede desactivar");
  });

  it("@HU-ACC-01 aDatos devuelve una copia: el perfil no cambia desde fuera", () => {
    const perfil = PerfilAccesibilidad.porDefecto();
    perfil.aDatos().modoSeniorActivo = true;
    expect(perfil.modoSeniorActivo).toBe(false);
    expect(perfil.id).toBeNull();
  });
});
