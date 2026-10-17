import { quorumDefinitivo } from "@/modulos/asambleas/dominio/quorum";

describe("@HU-ASA-07 Quórum definitivo", () => {
  const base = { padronTotal: 120, requerido: 61 };
  const casas = (n: number, desde = 0) => Array.from({ length: n }, (_, i) => `predio-${desde + i}`);

  it("@HU-ASA-07 CA2 cuenta solo presentes y poderes validados en el lugar", () => {
    const q = quorumDefinitivo({ ...base, presentes: casas(50), poderes: casas(5, 100) });
    expect(q).toMatchObject({ presentes: 50, poderes: 5, total: 55, faltan: 6, alcanza: false });
  });

  it("@HU-ASA-07 CA3 alcanza el quórum con el mínimo exacto", () => {
    const q = quorumDefinitivo({ ...base, presentes: casas(56), poderes: casas(5, 100) });
    expect(q.total).toBe(61);
    expect(q.alcanza).toBe(true);
    expect(q.faltan).toBe(0);
  });

  it("@HU-ASA-07 un voto por casa: si el titular llega y su poder también se valida, cuenta una vez", () => {
    const q = quorumDefinitivo({ ...base, presentes: ["a", "b"], poderes: ["b", "c"] });
    expect(q.presentes).toBe(2);
    expect(q.poderes).toBe(2);
    expect(q.total).toBe(3);
  });

  it("@HU-ASA-07 sin nadie presente no hay quórum y el porcentaje es 0", () => {
    const q = quorumDefinitivo({ ...base, presentes: [], poderes: [] });
    expect(q).toMatchObject({ total: 0, porcentaje: 0, faltan: 61, alcanza: false });
  });
});
