// @HU-GAR-26
import {
  accionesDelModulo,
  ACCIONES,
  describirAccion,
  MODULOS_AUDITORIA,
  type ModuloAuditoria,
} from "@/compartido/auditoria/acciones";
import { actoresDeAuditoria, leerAuditoria } from "@/compartido/auditoria/consultar";
import { prisma } from "@/compartido/bd/cliente";
import { fechaYHora } from "@/compartido/fechas";
import { exigirRol, type SesionDto } from "./sesion";

export { MODULOS_AUDITORIA };

export const POR_PAGINA = 50;
const SISTEMA = "El sistema (automático)";

export type FiltrosAuditoria = { modulo?: string; accion?: string; responsable?: string; antes?: string };

async function nombres(ids: string[]) {
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombreCompleto: true },
  });
  return new Map(usuarios.map((u) => [u.id, u.nombreCompleto]));
}

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** "politicaAceptadaEn" → "Politica aceptada en": el nombre del campo, leído como palabras. */
const etiqueta = (campo: string) => {
  const palabras = campo.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return palabras.charAt(0).toUpperCase() + palabras.slice(1);
};

const valorLegible = (valor: string | number | boolean) =>
  typeof valor === "boolean"
    ? valor
      ? "sí"
      : "no"
    : typeof valor === "string" && FECHA_ISO.test(valor)
      ? fechaYHora(new Date(valor))
      : valor;

/** Un resumen legible de lo que cambió: los datos sueltos de "después" (o de "antes", si se borró). */
function resumen(valores: unknown) {
  if (!valores || typeof valores !== "object") return null;
  const partes = Object.entries(valores as Record<string, unknown>)
    .filter((par): par is [string, string | number | boolean] =>
      ["string", "number", "boolean"].includes(typeof par[1]),
    )
    .slice(0, 4)
    .map(([k, v]) => `${etiqueta(k)}: ${valorLegible(v)}`);
  return partes.length ? partes.join(" · ") : null;
}

/**
 * La auditoría global (HU-GAR-26): las acciones críticas de todos los módulos en una sola vista, de la
 * más reciente a la más antigua (CA1), filtrables por módulo, acción y responsable (CA2). Solo lectura
 * (CA3): la tabla no admite cambios.
 */
export async function auditoriaGlobal(sesion: SesionDto, filtros: FiltrosAuditoria = {}) {
  exigirRol(sesion, "ADMINISTRADOR");
  const modulo = MODULOS_AUDITORIA.find((m) => m === filtros.modulo);
  const acciones =
    filtros.accion && filtros.accion in ACCIONES
      ? [filtros.accion]
      : modulo
        ? accionesDelModulo(modulo as ModuloAuditoria)
        : undefined;
  const actorId =
    filtros.responsable === "sistema" ? null : filtros.responsable ? filtros.responsable : undefined;
  const antesDe =
    filtros.antes && !Number.isNaN(Date.parse(filtros.antes)) ? new Date(filtros.antes) : undefined;

  const filas = await leerAuditoria({ acciones, actorId, antesDe, limite: POR_PAGINA + 1 });
  const pagina = filas.slice(0, POR_PAGINA);
  const actores = await actoresDeAuditoria();
  const nombresDe = await nombres(
    [...new Set([...pagina.map((f) => f.actorId), ...actores])].filter((id): id is string => !!id),
  );
  return {
    filas: pagina.map((f) => {
      const { modulo: moduloDeAccion, texto } = describirAccion(f.accion);
      return {
        id: f.id,
        fecha: fechaYHora(f.fecha),
        responsable: f.actorId ? (nombresDe.get(f.actorId) ?? "Persona ya no registrada") : SISTEMA,
        modulo: moduloDeAccion,
        texto,
        detalle: resumen(f.despues) ?? resumen(f.antes),
      };
    }),
    /** Para "Ver los anteriores": la fecha de la última fila, si hay más. */
    siguiente: filas.length > POR_PAGINA ? pagina[pagina.length - 1].fecha.toISOString() : null,
    responsables: actores
      .map((id) => ({
        valor: id ?? "sistema",
        texto: id ? (nombresDe.get(id) ?? "Persona ya no registrada") : SISTEMA,
      }))
      .sort((a, b) => a.texto.localeCompare(b.texto, "es")),
    acciones: Object.entries(ACCIONES)
      .filter(([, a]) => !modulo || a.modulo === modulo)
      .map(([valor, a]) => ({ valor, texto: a.texto })),
  };
}
