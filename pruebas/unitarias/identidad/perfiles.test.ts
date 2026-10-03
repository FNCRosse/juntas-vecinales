import { perfilesParaCambiar } from "@/modulos/identidad/aplicacion/perfiles";

describe("@HU-GAR-21 Cambiar entre el perfil de equipo y el de vecino", () => {
  it("@HU-GAR-21 quien es directiva y vecino puede pasar de un lado al otro", () => {
    expect(perfilesParaCambiar(["DIRECTIVA", "VECINO"], "directiva")).toEqual([
      {
        clave: "vecino",
        etiqueta: "Mi perfil de vecino",
        descripcion: "Ver la plataforma como la ve un vecino: su inicio, sus avisos y sus visitas.",
        href: "/",
      },
    ]);
    expect(perfilesParaCambiar(["DIRECTIVA", "VECINO"], "vecino")).toEqual([
      {
        clave: "directiva",
        etiqueta: "Mi perfil de directiva",
        descripcion: "Volver al resumen de la directiva: comunicados, actas y balances.",
        href: "/directiva",
      },
    ]);
  });

  it("@HU-GAR-21 con varios roles de equipo ofrece cada uno, y el vecino adulto mayor cuenta como vecino", () => {
    expect(
      perfilesParaCambiar(["ADMINISTRADOR", "DIRECTIVA", "VECINO_ADULTO_MAYOR"], "vecino").map((p) => p.href),
    ).toEqual(["/directiva", "/administracion"]);
    expect(
      perfilesParaCambiar(["ADMINISTRADOR", "DIRECTIVA", "VECINO"], "directiva").map((p) => p.href),
    ).toEqual(["/", "/administracion"]);
  });

  it("@HU-GAR-21 quien tiene un solo perfil no ve ningún cambio", () => {
    expect(perfilesParaCambiar(["ADMINISTRADOR"], "administracion")).toEqual([]);
    expect(perfilesParaCambiar(["VECINO"], "vecino")).toEqual([]);
    expect(perfilesParaCambiar(["DIRECTIVO_MEDIADOR"], "directiva")).toEqual([]);
    expect(perfilesParaCambiar(["VIGILANTE"], "garita")).toEqual([]);
  });

  it("@HU-GAR-21 el directivo mediador cuenta como directiva", () => {
    expect(perfilesParaCambiar(["DIRECTIVO_MEDIADOR", "VECINO"], "vecino").map((p) => p.clave)).toEqual([
      "directiva",
    ]);
  });
});
