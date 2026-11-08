import { destinoActual, OPCIONES_POR_ACTOR } from "@/componentes/a11y/BarraNavegacion";

// R-11: la barra del teléfono tiene como máximo cuatro destinos, en normal y en Senior.
// Las opciones con `hidden md:block` aparecen solo desde la tablet.
describe("@HU-ACC-09 Barra de navegación", () => {
  const delTelefono = (actor: keyof typeof OPCIONES_POR_ACTOR) =>
    OPCIONES_POR_ACTOR[actor].filter((o) => !o.clase?.includes("hidden"));

  it.each(Object.keys(OPCIONES_POR_ACTOR) as (keyof typeof OPCIONES_POR_ACTOR)[])(
    "@HU-ACC-09 CA2 %s: como máximo cuatro destinos en el teléfono",
    (actor) => {
      expect(delTelefono(actor).length).toBeLessThanOrEqual(4);
    },
  );

  it("@HU-ACC-09 CA2 el vecino conserva Incidentes fuera de la barra del teléfono, no fuera de la tablet", () => {
    const vecino = OPCIONES_POR_ACTOR.vecino;
    expect(delTelefono("vecino").map((o) => o.etiqueta)).toEqual(["Inicio", "Mi cuota", "Asambleas", "Más"]);
    expect(vecino.some((o) => o.etiqueta === "Incidentes")).toBe(true);
  });

  it("@HU-ACC-09 CA2 cada pantalla marca el mismo destino que en el prototipo", () => {
    expect(destinoActual("vecino", "/")).toBe("/");
    expect(destinoActual("vecino", "/avisos")).toBe("/");
    expect(destinoActual("vecino", "/noticias")).toBe("/");
    expect(destinoActual("vecino", "/avisos/preferencias")).toBe("/mas");
    expect(destinoActual("vecino", "/visitas/nueva")).toBe("/mas");
    expect(destinoActual("vecino", "/transparencia/cuentas")).toBe("/mas");
    expect(destinoActual("vecino", "/cuota/pagar")).toBe("/cuota");
    expect(destinoActual("vecino", "/incidentes/reportar")).toBe("/incidentes");
    expect(destinoActual("directiva", "/directiva/cobros/tarifa")).toBe("/directiva/cobros");
    expect(destinoActual("directiva", "/directiva")).toBe("/directiva");
  });
});
