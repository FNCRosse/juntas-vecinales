import { ordenarHistorial } from "@/modulos/transparencia/dominio/historial";

const dia = (d: number) => new Date(Date.UTC(2026, 8, d, 17));

describe("@HU-ASA-12 Historial público de actas y balances", () => {
  it("@HU-ASA-12 CA1 ordena del más nuevo al más antiguo por la fecha del evento, sin importar el tipo", () => {
    const lista = [
      { id: "acta-12", fechaEvento: dia(12), fechaPublicacion: dia(13) },
      { id: "balance-26", fechaEvento: dia(26), fechaPublicacion: dia(27) },
      { id: "acta-19", fechaEvento: dia(19), fechaPublicacion: dia(20) },
    ];
    expect(ordenarHistorial(lista).map((x) => x.id)).toEqual(["balance-26", "acta-19", "acta-12"]);
  });

  it("@HU-ASA-12 CA1 si dos son del mismo día, va primero el publicado más recientemente", () => {
    const lista = [
      { id: "temprano", fechaEvento: dia(19), fechaPublicacion: dia(20) },
      { id: "tarde", fechaEvento: dia(19), fechaPublicacion: dia(22) },
    ];
    expect(ordenarHistorial(lista).map((x) => x.id)).toEqual(["tarde", "temprano"]);
  });

  it("@HU-ASA-12 no cambia la lista original", () => {
    const lista = [
      { id: "a", fechaEvento: dia(1), fechaPublicacion: dia(1) },
      { id: "b", fechaEvento: dia(2), fechaPublicacion: dia(2) },
    ];
    ordenarHistorial(lista);
    expect(lista.map((x) => x.id)).toEqual(["a", "b"]);
  });
});
