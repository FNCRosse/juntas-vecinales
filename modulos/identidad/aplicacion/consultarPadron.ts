// @HU-GAR-01 @HU-GAR-10
import { ErrorNoEncontrado } from "@/compartido/errores";
import { NOMBRE_RELACION } from "@/modulos/identidad/dominio/empadronamiento";
import { CONCEPTOS, type Concepto, direccion, type UsoPredio } from "@/modulos/identidad/dominio/predio";
import {
  buscarPredio,
  historialDePredio,
  contarPadron,
  type FiltrosPadron,
  listarPredios,
  manzanasDelPadron,
} from "@/modulos/identidad/infraestructura/repositorioPadron";
import { exigirRol, type SesionDto } from "./sesion";

export const NOMBRE_USO: Record<UsoPredio, string> = {
  VIVIENDA: "Vivienda",
  NEGOCIO: "Negocio",
  VIVIENDA_Y_NEGOCIO: "Vivienda y negocio",
};

export const NOMBRE_CONCEPTO: Record<Concepto, [singular: string, plural: string]> = {
  familias: ["familia", "familias"],
  inquilinos: ["inquilino", "inquilinos"],
  autos: ["auto o camioneta", "autos o camionetas"],
  motos: ["moto", "motos"],
  triciclos: ["triciclo o carreta", "triciclos o carretas"],
  negocios: ["local de negocio", "locales de negocio"],
};

/** "1 familia · 1 auto o camioneta": solo los conceptos que tiene. */
export function ocupacionEnTexto(ocupacion: Record<Concepto, number>) {
  return CONCEPTOS.filter((c) => ocupacion[c] > 0)
    .map((c) => `${ocupacion[c]} ${NOMBRE_CONCEPTO[c][ocupacion[c] === 1 ? 0 : 1]}`)
    .join(" · ");
}

type Fila = NonNullable<Awaited<ReturnType<typeof buscarPredio>>>;
/** Lo que comparten la ficha y la lista del padrón: la lista no carga los vehículos. */
type FilaBase = Omit<Fila, "vehiculos">;

function residentes(predio: FilaBase) {
  return [...predio.residencias]
    .sort((a, b) => Number(b.relacion === "TITULAR") - Number(a.relacion === "TITULAR"))
    .map((r) => ({
      usuarioId: r.usuario.id,
      nombre: r.usuario.nombreCompleto,
      relacion: NOMBRE_RELACION[r.relacion],
      dni: r.usuario.dni,
      whatsapp: r.usuario.telefonoWhatsApp?.replace(/^51(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3") ?? null,
    }));
}

function resumen(predio: FilaBase) {
  const lista = residentes(predio);
  return {
    id: predio.id,
    direccion: direccion(predio),
    uso: NOMBRE_USO[predio.uso],
    titular: lista[0]?.nombre ?? "Sin titular",
    numeroResidentes: lista.length,
    ocupacion: ocupacionEnTexto(predio),
  };
}

type Json = unknown;
const CAMPOS_DE_PLACAS = { placasAutos: "placas de autos", placasMotos: "placas de motos" } as const;
const etiquetaCampo = (campo: string) =>
  campo === "uso"
    ? "uso"
    : (CAMPOS_DE_PLACAS[campo as keyof typeof CAMPOS_DE_PLACAS] ??
      NOMBRE_CONCEPTO[campo as Concepto]?.[1] ??
      campo);
const valorCampo = (valor: unknown) =>
  typeof valor === "string" && valor in NOMBRE_USO
    ? NOMBRE_USO[valor as UsoPredio].toLowerCase()
    : String(valor);

/** El historial de la ficha (ADM-PAD-02) en palabras: qué se hizo, con los valores antes y después. */
function describirAccion(accion: string, antes: Json, despues: Json) {
  const a = (antes ?? {}) as Record<string, unknown>;
  const d = (despues ?? {}) as Record<string, unknown>;
  switch (accion) {
    case "empadronar":
      return "Empadronó la vivienda, con el DNI de cada residente verificado en físico";
    case "actualizar_predio":
      // jsonb no guarda el orden de las claves: se describen en el orden de la pantalla.
      return `Actualizó los datos: ${["uso", ...CONCEPTOS, "placasAutos", "placasMotos"]
        .filter((campo) => campo in d)
        .map((campo) => `${etiquetaCampo(campo)} ${valorCampo(a[campo])} → ${valorCampo(d[campo])}`)
        .join("; ")}`;
    case "dar_de_baja_residente":
      return `Dio de baja a ${String(a.nombre)}: ${String(d.motivo).toLowerCase()}`;
    default:
      return accion.replace(/_/g, " ");
  }
}

/** Padrón de viviendas para la administración (ADM-PAD-01), con búsqueda y filtro por manzana. */
export async function listarPadron(sesion: SesionDto, filtros: FiltrosPadron) {
  exigirRol(sesion, "ADMINISTRADOR");
  const texto = filtros.texto?.trim() || undefined;
  const [predios, totales, manzanas] = await Promise.all([
    listarPredios({ texto, manzana: filtros.manzana || undefined }),
    contarPadron(),
    manzanasDelPadron(),
  ]);
  return { viviendas: predios.map(resumen), totales, manzanas };
}

/** Ficha de una vivienda (ADM-PAD-02). */
export async function verVivienda(sesion: SesionDto, predioId: string) {
  exigirRol(sesion, "ADMINISTRADOR");
  const predio = await buscarPredio(predioId);
  if (!predio) throw new ErrorNoEncontrado();
  const historial = await historialDePredio(predioId);
  return {
    ...resumen(predio),
    residentes: residentes(predio),
    vehiculos: predio.vehiculos.map((v) => ({
      placa: v.placa,
      tipo:
        v.tipo === "AUTO_O_CAMIONETA"
          ? ("auto" as const)
          : v.tipo === "MOTO"
            ? ("moto" as const)
            : ("triciclo" as const),
    })),
    ocupacion: {
      uso: predio.uso,
      ...(Object.fromEntries(CONCEPTOS.map((c) => [c, predio[c]])) as Record<Concepto, number>),
    },
    historial: historial.map((h) => ({
      id: h.id,
      fecha: h.fecha.toISOString(),
      actor: h.actor,
      texto: describirAccion(h.accion, h.antes, h.despues),
    })),
    conceptos: CONCEPTOS.map((c) => ({
      concepto: NOMBRE_CONCEPTO[c][1].replace(/^./, (letra) => letra.toUpperCase()),
      cantidad: predio[c],
    })),
  };
}
