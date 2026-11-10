import { existsSync } from "node:fs";
import path from "node:path";
import { RECORRIDOS } from "@/modulos/accesibilidad/dominio/recorridos";

// VAM-08: cada paso de cada guía tiene su captura con el botón marcado (pruebas/e2e/capturas/guias.captura.ts). Si se agrega un
// paso sin su imagen, la guía mostraría una imagen rota.
describe("@HU-ACC-10 CA1 [VAM-08] capturas de las guías por sección", () => {
  it.each(Object.entries(RECORRIDOS))(
    "@HU-ACC-10 CA1 [VAM-08] %s tiene una captura por paso",
    (seccion, recorrido) => {
      for (let paso = 1; paso <= recorrido.pasos.length; paso++) {
        const archivo = path.join("public", "guias", `${seccion.toLowerCase()}-${paso}.png`);
        expect(existsSync(archivo)).toBe(true);
      }
    },
  );
});
