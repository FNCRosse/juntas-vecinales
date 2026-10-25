import { textoDeRecordatorios, textoDeSuspensiones } from "@/modulos/aportes/dominio/morosidad";

describe("@HU-COB-05 @HU-COB-06 Lo que se le avisa a la directiva", () => {
  it("@HU-COB-05 CA3 los recordatorios enviados, con las palabras del prototipo y sin recargo", () => {
    expect(textoDeRecordatorios(30)).toBe(
      "Se enviaron 30 recordatorios amables a casas con una semana de atraso. No se aplicó ningún recargo.",
    );
    expect(textoDeRecordatorios(1)).toBe(
      "Se envió 1 recordatorio amable a una casa con una semana de atraso. No se aplicó ningún recargo.",
    );
  });

  it("@HU-COB-06 CA3 las casas que llegaron a 8 semanas, en singular y en plural", () => {
    expect(textoDeSuspensiones(12)).toBe(
      "12 casas llegaron a 8 semanas sin pago. La reja ya no se les abre sola y se les avisó.",
    );
    expect(textoDeSuspensiones(1)).toBe(
      "1 casa llegó a 8 semanas sin pago. La reja ya no se le abre sola y se le avisó.",
    );
  });
});
