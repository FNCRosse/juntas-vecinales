// @HU-GAR-01
import { ErrorNoEncontrado } from "@/compartido/errores";
import { NOMBRE_RELACION } from "@/modulos/identidad/dominio/empadronamiento";
import { CONCEPTOS, type Concepto, direccion, type UsoPredio } from "@/modulos/identidad/dominio/predio";
import {
  buscarPredio,
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

function residentes(predio: Fila) {
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

function resumen(predio: Fila) {
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
  return {
    ...resumen(predio),
    residentes: residentes(predio),
    conceptos: CONCEPTOS.map((c) => ({
      concepto: NOMBRE_CONCEPTO[c][1].replace(/^./, (letra) => letra.toUpperCase()),
      cantidad: predio[c],
    })),
  };
}
