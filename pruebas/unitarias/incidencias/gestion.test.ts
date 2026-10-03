import { prepararAdmisibilidad } from "@/modulos/incidencias/dominio/gestion";
import { novedadDelReporte } from "@/modulos/incidencias/dominio/seguimiento";

describe("@HU-QUE-05 Admisibilidad", () => {
  it("@HU-QUE-05 CA2 admitir exige prioridad y pasa a En revisión", () => {
    expect(prepararAdmisibilidad("RECIBIDO", { decision: "admitir", prioridad: "ALTA" })).toEqual({
      errores: {},
      cambio: { estado: "EN_REVISION", prioridad: "ALTA", motivoRechazo: null },
    });
    expect(prepararAdmisibilidad("RECIBIDO", { decision: "admitir", prioridad: "URGENTE" }).errores).toEqual({
      prioridad: "Elija la prioridad.",
    });
  });

  it("@HU-QUE-05 CA3 rechazar exige un motivo de hasta 500 letras y pasa a No procede", () => {
    expect(prepararAdmisibilidad("RECIBIDO", { decision: "rechazar", motivo: " Es falso. " })).toEqual({
      errores: {},
      cambio: { estado: "RECHAZADO", prioridad: null, motivoRechazo: "Es falso." },
    });
    expect(prepararAdmisibilidad("RECIBIDO", { decision: "rechazar" }).errores.motivo).toContain(
      "Escriba por qué",
    );
    expect(
      prepararAdmisibilidad("RECIBIDO", { decision: "rechazar", motivo: "x".repeat(501) }).errores.motivo,
    ).toBe("Escriba el motivo en menos de 500 letras.");
  });

  it("@HU-QUE-05 un reporte ya evaluado no se vuelve a evaluar", () => {
    expect(prepararAdmisibilidad("EN_REVISION", { decision: "admitir", prioridad: "ALTA" })).toEqual({
      errores: {},
      yaEvaluada: true,
    });
  });

  it("@HU-QUE-05 la novedad del avance dice qué decidió la directiva", () => {
    expect(novedadDelReporte("RECIBIDO", null)).toBeNull();
    expect(novedadDelReporte("EN_REVISION", null)?.titulo).toBe("La directiva revisa su reporte");
    expect(novedadDelReporte("RECHAZADO", "Es falso.")?.texto).toBe(
      "Es falso. Si cree que es un error, pida ayuda a una persona.",
    );
  });
});
