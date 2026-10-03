import { ordenarNoticias, prepararComunicado } from "@/modulos/transparencia/dominio/comunicado";

const T0 = new Date("2026-10-05T15:00:00Z");
const horas = (h: number) => new Date(T0.getTime() + h * 3_600_000);

describe("@HU-ASA-15 Comunicado general", () => {
  it("@HU-ASA-15 CA1 recorta los espacios y exige título y mensaje con mensajes en lenguaje llano", () => {
    expect(
      prepararComunicado({
        titulo: "  Corte de agua  ",
        cuerpo: " Mañana de 9 a 12. ",
        urgencia: "INFORMATIVO",
      }),
    ).toEqual({
      errores: {},
      comunicado: { titulo: "Corte de agua", cuerpo: "Mañana de 9 a 12.", urgencia: "INFORMATIVO" },
    });
    expect(prepararComunicado({ titulo: " ", cuerpo: "", urgencia: "INFORMATIVO" }).errores).toEqual({
      titulo: "Escriba el título del comunicado.",
      cuerpo: "Escriba el mensaje del comunicado.",
    });
  });

  it("@HU-ASA-15 CA1 limita el largo para que el aviso se lea completo en el teléfono", () => {
    const { errores } = prepararComunicado({
      titulo: "x".repeat(121),
      cuerpo: "y".repeat(1501),
      urgencia: "URGENTE",
    });
    expect(errores).toEqual({
      titulo: "El título puede tener hasta 120 letras. Hágalo más corto.",
      cuerpo: "El mensaje puede tener hasta 1500 letras. Hágalo más corto.",
    });
  });

  it("@HU-ASA-15 CA3 la urgencia es informativo o urgente y no hay otra", () => {
    const { errores } = prepararComunicado({ titulo: "a", cuerpo: "b", urgencia: "MEDIA" as never });
    expect(errores).toEqual({ urgencia: "Elija si el comunicado es informativo o urgente." });
  });

  it("@HU-ASA-15 CA3 ordena los urgentes primero y, dentro de cada grupo, los más nuevos arriba", () => {
    const lista = [
      { id: "a", urgencia: "INFORMATIVO" as const, fechaPublicacion: horas(3) },
      { id: "b", urgencia: "URGENTE" as const, fechaPublicacion: horas(1) },
      { id: "c", urgencia: "INFORMATIVO" as const, fechaPublicacion: horas(5) },
      { id: "d", urgencia: "URGENTE" as const, fechaPublicacion: horas(2) },
    ];
    expect(ordenarNoticias(lista).map((n) => n.id)).toEqual(["d", "b", "c", "a"]);
  });
});
