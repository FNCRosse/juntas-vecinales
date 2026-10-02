// @HU-ACC-08
// Errores tipados del sistema (docs/BACKEND.md §4). Cada uno lleva el mensaje para la persona,
// con trato de usted: qué pasó y cómo seguir, sin códigos técnicos ni culpa (HU-ACC-03 CA2, HU-ACC-08).

export abstract class ErrorDeAplicacion extends Error {
  abstract readonly estadoHttp: number;

  constructor(readonly mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

/** Dato con forma incorrecta. `campos` lleva el mensaje de cada campo para mostrarlo a su lado. */
export class ErrorValidacion extends ErrorDeAplicacion {
  readonly estadoHttp = 400;

  constructor(
    mensaje = "Revise los datos marcados y corríjalos para continuar.",
    readonly campos: Record<string, string> = {},
  ) {
    super(mensaje);
  }
}

export class ErrorNoAutenticado extends ErrorDeAplicacion {
  readonly estadoHttp = 401;

  constructor(mensaje = "Por su seguridad, vuelva a entrar.") {
    super(mensaje);
  }
}

export class ErrorNoAutorizado extends ErrorDeAplicacion {
  readonly estadoHttp = 403;

  constructor(
    mensaje = "Su cuenta no tiene permiso para hacer esto. Si lo necesita, pida ayuda a la directiva.",
  ) {
    super(mensaje);
  }
}

/** No existe o no es visible para quien pregunta: nunca se revela cuál de las dos (AC-7). */
export class ErrorNoEncontrado extends ErrorDeAplicacion {
  readonly estadoHttp = 404;

  constructor(mensaje = "No encontramos lo que busca. Vuelva al inicio e inténtelo otra vez.") {
    super(mensaje);
  }
}

export class ErrorConflicto extends ErrorDeAplicacion {
  readonly estadoHttp = 409;
}

export class ErrorReglaNegocio extends ErrorDeAplicacion {
  readonly estadoHttp = 422;
}

/** Demasiados intentos: se pausa la operación un tiempo (entrada con clave, HU-GAR-24 CA3). */
export class ErrorEnPausa extends ErrorDeAplicacion {
  readonly estadoHttp = 429;
}

export const MENSAJE_ERROR_INESPERADO = "No pudimos completar la acción. Intente de nuevo en unos minutos.";
