// @HU-ASA-08
// Actividad pro fondos (pollada, bingo, rifa…): la junta la publica y los vecinos colaboran pagando por unidad
// (platos, boletos) de forma anticipada o en la puerta. El dominio limpia y revisa los datos; no sabe de la BD.

export type TipoActividad = "POLLADA" | "PARRILLADA" | "BINGO" | "RIFA" | "OTRA";
export const TIPOS_DE_ACTIVIDAD: readonly TipoActividad[] = [
  "POLLADA",
  "PARRILLADA",
  "BINGO",
  "RIFA",
  "OTRA",
];

/** Cómo se llama cada tipo (prototipo DAS12). */
export const TIPO_EN_TEXTO: Record<TipoActividad, string> = {
  POLLADA: "Pollada",
  PARRILLADA: "Parrillada",
  BINGO: "Bingo",
  RIFA: "Rifa",
  OTRA: "Otra actividad",
};

/** Lo que se paga por unidad: platos en las comidas, boletos en el bingo y la rifa. */
export const UNIDAD_DE_ACTIVIDAD: Record<TipoActividad, { singular: string; plural: string }> = {
  POLLADA: { singular: "plato", plural: "platos" },
  PARRILLADA: { singular: "plato", plural: "platos" },
  BINGO: { singular: "boleto", plural: "boletos" },
  RIFA: { singular: "boleto", plural: "boletos" },
  OTRA: { singular: "aporte", plural: "aportes" },
};

export type PagosDeActividad = "AMBOS" | "ANTICIPADO" | "PUERTA";
export const PAGOS: readonly PagosDeActividad[] = ["AMBOS", "ANTICIPADO", "PUERTA"];

export const PAGOS_EN_TEXTO: Record<PagosDeActividad, string> = {
  AMBOS: "Por Yape o Plin y en la puerta",
  ANTICIPADO: "Solo por Yape o Plin",
  PUERTA: "Solo en la puerta",
};

export type ModalidadAporte = "ANTICIPADA" | "EN_PUERTA";

/** Las formas de pagar que admite la actividad según lo que eligió la directiva. */
export function modalidadesAdmitidas(pagos: PagosDeActividad): ModalidadAporte[] {
  if (pagos === "ANTICIPADO") return ["ANTICIPADA"];
  if (pagos === "PUERTA") return ["EN_PUERTA"];
  return ["ANTICIPADA", "EN_PUERTA"];
}

export const MAXIMO_NOMBRE = 120;
export const MAXIMO_PARA_QUE = 300;
export const MAXIMO_LUGAR = 160;

export type DatosActividad = {
  tipoActividad: TipoActividad;
  nombre: string;
  paraQue: string;
  fechaHora: Date;
  lugar: string;
  /** Céntimos por plato o boleto; null si el monto no se pudo leer. */
  precioUnidad: number | null;
  /** Meta opcional en céntimos; null si se dejó vacía. */
  metaRecaudacion: number | null;
  pagos: PagosDeActividad;
};

/** Revisa y limpia los datos. Los mensajes dicen qué corregir, con trato de usted y sin tecnicismos. */
export function prepararActividad(datos: DatosActividad, ahora = new Date()) {
  const errores: Record<string, string> = {};
  const nombre = datos.nombre.trim().replace(/\s+/g, " ");
  const paraQue = datos.paraQue.trim();
  const lugar = datos.lugar.trim();

  if (!TIPOS_DE_ACTIVIDAD.includes(datos.tipoActividad)) errores.tipoActividad = "Elija qué actividad es.";
  if (!nombre) errores.nombre = "Escriba el nombre de la actividad.";
  else if (nombre.length > MAXIMO_NOMBRE) {
    errores.nombre = `El nombre puede tener hasta ${MAXIMO_NOMBRE} letras. Hágalo más corto.`;
  }
  if (!paraQue) errores.paraQue = "Cuente para qué se juntará el dinero.";
  else if (paraQue.length > MAXIMO_PARA_QUE) {
    errores.paraQue = `Puede escribir hasta ${MAXIMO_PARA_QUE} letras. Hágalo más corto.`;
  }
  if (Number.isNaN(datos.fechaHora.getTime()))
    errores.fechaHora = "Indique la fecha y la hora de la actividad.";
  else if (datos.fechaHora.getTime() <= ahora.getTime()) {
    errores.fechaHora = "La fecha de la actividad debe ser posterior a hoy.";
  }
  if (!lugar) errores.lugar = "Escriba el lugar de la actividad.";
  else if (lugar.length > MAXIMO_LUGAR) {
    errores.lugar = `El lugar puede tener hasta ${MAXIMO_LUGAR} letras. Hágalo más corto.`;
  }
  if (datos.precioUnidad === null || datos.precioUnidad <= 0) {
    errores.precioUnidad = "Escriba el precio en soles, por ejemplo 15 o 15.50.";
  }
  if (datos.metaRecaudacion !== null && datos.metaRecaudacion <= 0) {
    errores.metaRecaudacion = "La meta debe ser un monto en soles mayor que cero, o déjela vacía.";
  }
  if (!PAGOS.includes(datos.pagos)) errores.pagos = "Elija cómo pueden pagar los vecinos.";

  return {
    errores,
    actividad: {
      tipoActividad: datos.tipoActividad,
      nombre,
      paraQue,
      fechaHora: datos.fechaHora,
      lugar,
      precioUnidad: datos.precioUnidad ?? 0,
      metaRecaudacion: datos.metaRecaudacion,
      pagos: datos.pagos,
    },
  };
}

export const MINIMO_UNIDADES = 1;
/** Cuántas unidades puede aportar una casa a una actividad (valor del prototipo: hasta 10). */
export const MAXIMO_UNIDADES = 10;

export type DatosColaboracion = { cantidad: number; modalidad: ModalidadAporte };

/** Revisa el aporte de una casa: cuántas unidades y de qué forma, dentro de lo que admite la actividad. */
export function prepararColaboracion(
  datos: DatosColaboracion,
  pagos: PagosDeActividad,
  precioUnidad: number,
) {
  const errores: Record<string, string> = {};
  if (
    !Number.isInteger(datos.cantidad) ||
    datos.cantidad < MINIMO_UNIDADES ||
    datos.cantidad > MAXIMO_UNIDADES
  ) {
    errores.cantidad = `Elija entre ${MINIMO_UNIDADES} y ${MAXIMO_UNIDADES}.`;
  }
  if (!modalidadesAdmitidas(pagos).includes(datos.modalidad)) {
    errores.modalidad = "Esa forma de pago no está disponible para esta actividad. Elija otra.";
  }
  return { errores, monto: datos.cantidad * precioUnidad };
}
