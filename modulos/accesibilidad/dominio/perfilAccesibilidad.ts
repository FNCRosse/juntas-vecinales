// Clase PerfilAccesibilidad del diagrama 02f (ADR-004). Se guarda en el servidor y se aplica al renderizar.

export type EscalaTipografica = "NORMAL" | "GRANDE" | "MUY_GRANDE";

export type DatosPerfil = {
  id: string | null;
  usuarioId: string | null;
  modoSeniorActivo: boolean;
  escalaTipografica: EscalaTipografica;
  altoContrasteActivo: boolean;
  sintesisVozActiva: boolean;
  confirmacionEnDosPasosActiva: boolean;
  areaTactilAmpliada: boolean;
};

export class PerfilAccesibilidad {
  private constructor(private datos: DatosPerfil) {
    if (!datos.confirmacionEnDosPasosActiva) {
      // WCAG 3.3.4 y HU-ACC-03: dinero, voto, queja y bajas siempre piden confirmación.
      throw new Error("La confirmación en dos pasos no se puede desactivar");
    }
  }

  /** Perfil sin cuenta o todavía no guardado: modo Normal (ADR-004 descarta activarlo por la edad). */
  static porDefecto(usuarioId: string | null = null) {
    return new PerfilAccesibilidad({
      id: null,
      usuarioId,
      modoSeniorActivo: false,
      escalaTipografica: "NORMAL",
      altoContrasteActivo: false,
      sintesisVozActiva: false,
      confirmacionEnDosPasosActiva: true,
      areaTactilAmpliada: false,
    });
  }

  static reconstruir(datos: DatosPerfil) {
    return new PerfilAccesibilidad({ ...datos });
  }

  /** "Letra grande": texto de 22 px, contraste ≥ 7:1 y objetivos de 56 px, todo por token (HU-ACC-01 CA2). */
  activarModoSenior() {
    Object.assign(this.datos, {
      modoSeniorActivo: true,
      escalaTipografica: "GRANDE",
      altoContrasteActivo: true,
      areaTactilAmpliada: true,
    } satisfies Partial<DatosPerfil>);
  }

  desactivarModoSenior() {
    Object.assign(this.datos, {
      modoSeniorActivo: false,
      escalaTipografica: "NORMAL",
      altoContrasteActivo: false,
      areaTactilAmpliada: false,
    } satisfies Partial<DatosPerfil>);
  }

  /** Lectura en voz alta de las noticias (HU-ACC-02 CA1): no cambia nada más del perfil. */
  activarSintesisVoz() {
    this.datos.sintesisVozActiva = true;
  }

  desactivarSintesisVoz() {
    this.datos.sintesisVozActiva = false;
  }

  get id() {
    return this.datos.id;
  }

  get modoSeniorActivo() {
    return this.datos.modoSeniorActivo;
  }

  aDatos(): DatosPerfil {
    return { ...this.datos };
  }
}
