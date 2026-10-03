import { prepararAdmisibilidad, prepararResolucion } from "@/modulos/incidencias/dominio/gestion";
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

describe("@HU-QUE-06 Acciones correctivas y cierre", () => {
  it("@HU-QUE-06 CA1 CA2 exige la medida y el detalle; solo cierra un reporte en revisión", () => {
    expect(
      prepararResolucion("EN_REVISION", { medida: "MEDIACION", detalle: " Acordaron bajar la música. " }),
    ).toEqual({
      errores: {},
      accion: { medida: "MEDIACION", detalle: "Acordaron bajar la música." },
    });
    expect(prepararResolucion("EN_REVISION", {}).errores).toEqual({
      medida: "Elija qué medida se tomó.",
      detalle: "Escriba qué se hizo. Se lo enviaremos a quien reportó.",
    });
    expect(
      prepararResolucion("EN_REVISION", { medida: "OTRA", detalle: "x".repeat(1001) }).errores.detalle,
    ).toBe("Escriba el detalle en menos de 1000 letras.");
    expect(prepararResolucion("RECIBIDO", { medida: "OTRA", detalle: "x" })).toEqual({
      errores: {},
      noSePuede: true,
    });
  });

  it("@HU-QUE-06 CA3 la novedad del avance trae el detalle de lo resuelto", () => {
    expect(novedadDelReporte("RESUELTO", null, "Acordaron bajar la música.")).toEqual({
      tipo: "exito",
      titulo: "Su reporte se resolvió",
      texto: "Acordaron bajar la música.",
    });
  });
});
