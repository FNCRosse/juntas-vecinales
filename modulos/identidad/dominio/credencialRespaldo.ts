// CredencialRespaldo del diagrama 02a: la clave de respaldo del vecino y la de las cuentas internas.
// Cinco fallos seguidos pausan la entrada con clave por 15 minutos (HU-GAR-24 CA3).

export const MAX_FALLOS = 5;
export const MINUTOS_DE_PAUSA = 15;

export type DatosCredencial = { fallosSeguidos: number; bloqueadaHasta: Date | null };

export class CredencialRespaldo {
  private constructor(private datos: DatosCredencial) {}

  static reconstruir(datos: DatosCredencial) {
    return new CredencialRespaldo({ ...datos });
  }

  estaEnPausa(ahora: Date) {
    return this.datos.bloqueadaHasta !== null && this.datos.bloqueadaHasta > ahora;
  }

  /** Un fallo más; al quinto seguido, la entrada con clave queda en pausa. */
  registrarFallo(ahora: Date) {
    const fallos = this.datos.fallosSeguidos + 1;
    this.datos =
      fallos >= MAX_FALLOS
        ? { fallosSeguidos: 0, bloqueadaHasta: new Date(ahora.getTime() + MINUTOS_DE_PAUSA * 60_000) }
        : { fallosSeguidos: fallos, bloqueadaHasta: null };
  }

  registrarExito() {
    this.datos = { fallosSeguidos: 0, bloqueadaHasta: null };
  }

  aDatos(): DatosCredencial {
    return { ...this.datos };
  }
}
