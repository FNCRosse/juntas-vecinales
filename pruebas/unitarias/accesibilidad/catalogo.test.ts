import Layout from "@/app/catalogo/layout";

describe("@HU-ACC-05 Catálogo interno", () => {
  const original = process.env.VERCEL_ENV;
  const fijar = (valor: string | undefined) => {
    if (valor === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = valor;
  };
  afterEach(() => fijar(original));

  it("@HU-ACC-05 no se publica en producción: responde 404", () => {
    fijar("production");
    expect(() => Layout({ children: null })).toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });

  it("@HU-ACC-05 existe en local, en el CI y en las previews", () => {
    for (const entorno of [undefined, "preview", "development"]) {
      fijar(entorno);
      expect(Layout({ children: "catálogo" })).toBe("catálogo");
    }
  });
});
