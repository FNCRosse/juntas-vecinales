import { CredencialRespaldo, MAX_FALLOS } from "@/modulos/identidad/dominio/credencialRespaldo";

const T0 = new Date("2026-10-05T15:00:00Z");
const minutos = (m: number) => new Date(T0.getTime() + m * 60_000);

describe("@HU-GAR-24 CredencialRespaldo", () => {
  it("@HU-GAR-24 CA3 al quinto fallo seguido pausa la entrada con clave por 15 minutos", () => {
    const credencial = CredencialRespaldo.reconstruir({ fallosSeguidos: 0, bloqueadaHasta: null });
    for (let i = 1; i < MAX_FALLOS; i++) {
      credencial.registrarFallo(T0);
      expect(credencial.estaEnPausa(T0)).toBe(false);
    }
    credencial.registrarFallo(T0);
    expect(credencial.estaEnPausa(T0)).toBe(true);
    expect(credencial.estaEnPausa(minutos(14.9))).toBe(true);
    expect(credencial.estaEnPausa(minutos(15))).toBe(false);
    expect(credencial.aDatos()).toEqual({ fallosSeguidos: 0, bloqueadaHasta: minutos(15) });
  });

  it("@HU-GAR-24 CA3 una entrada correcta reinicia la cuenta de fallos", () => {
    const credencial = CredencialRespaldo.reconstruir({ fallosSeguidos: 4, bloqueadaHasta: null });
    credencial.registrarExito();
    credencial.registrarFallo(T0);
    expect(credencial.aDatos()).toEqual({ fallosSeguidos: 1, bloqueadaHasta: null });
  });
});
