import { ChevronLeft, ChevronRight, Filter, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { clasesBoton } from "@/componentes/a11y/Boton";
import { FiltroEnHoja } from "@/componentes/a11y/FiltroEnHoja";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import {
  auditoriaGlobal,
  type FiltrosAuditoria,
  MODULOS_AUDITORIA,
} from "@/modulos/identidad/aplicacion/auditoria";

export const metadata: Metadata = { title: "Auditoría" };

const CLASE_SELECT =
  "min-h-control w-full rounded-control border-(length:--borde-ancho-control) border-borde-control bg-fondo-superficie px-4 text-base text-texto-principal hover:border-borde-fuerte";

/** La URL de la auditoría con los filtros actuales y los cambios indicados. */
function enlace(filtros: FiltrosAuditoria, cambios: FiltrosAuditoria) {
  const parametros = Object.entries({ ...filtros, ...cambios }).filter(([, v]) => v) as [string, string][];
  return parametros.length
    ? `/administracion/auditoria?${new URLSearchParams(parametros)}`
    : "/administracion/auditoria";
}

// ADM-AUD-01 Auditoría global (HU-GAR-26): todas las acciones críticas, de la más reciente a la más
// antigua (CA1), con filtros por módulo, acción y responsable (CA2). Solo lectura (CA3).
export default async function Auditoria({ searchParams }: { searchParams: Promise<FiltrosAuditoria> }) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const { modulo, accion, responsable, antes } = await searchParams;
  const filtros = { modulo, accion, responsable };
  const { filas, siguiente, responsables, acciones } = await auditoriaGlobal(sesion, { ...filtros, antes });

  const descripcionDelFiltro =
    [
      modulo && MODULOS_AUDITORIA.some((x) => x === modulo) ? modulo : null,
      responsables.find((r) => r.valor === responsable)?.texto,
      acciones.find((a) => a.valor === accion)?.texto,
    ]
      .filter(Boolean)
      .join(" · ") || "Todas";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Auditoría</h1>
        <p>
          Las acciones importantes de todo el sistema en un solo lugar, de la más reciente a la más antigua.
          Nadie puede editarlas ni borrarlas.
        </p>
      </div>

      <FiltroEnHoja
        actual={descripcionDelFiltro}
        titulo="Mostrar acciones de"
        opciones={[undefined, ...MODULOS_AUDITORIA].map((m) => ({
          etiqueta: m ?? "Todos los módulos",
          href: enlace({}, { modulo: m, responsable }),
          activa: modulo === m || (!m && !MODULOS_AUDITORIA.some((x) => x === modulo)),
        }))}
        pie={
          <form method="get" className="flex flex-col gap-4">
            {modulo && <input type="hidden" name="modulo" value={modulo} />}
            <div className="flex flex-col gap-3">
              <label htmlFor="filtro-responsable" className="font-bold">
                Responsable
              </label>
              <select
                id="filtro-responsable"
                name="responsable"
                defaultValue={responsable ?? ""}
                className={CLASE_SELECT}
              >
                <option value="">Todas las personas</option>
                {responsables.map((r) => (
                  <option key={r.valor} value={r.valor}>
                    {r.texto}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <label htmlFor="filtro-accion" className="font-bold">
                Tipo de acción
              </label>
              <select id="filtro-accion" name="accion" defaultValue={accion ?? ""} className={CLASE_SELECT}>
                <option value="">Todas las acciones</option>
                {acciones.map((a) => (
                  <option key={a.valor} value={a.valor}>
                    {a.texto}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={clasesBoton("primario", true)}>
              <Filter aria-hidden className="size-icono shrink-0" />
              <span>Aplicar responsable y acción</span>
            </button>
          </form>
        }
      />

      <p role="status" className="text-texto-secundario">
        {filas.length === 1 ? "1 registro" : `${filas.length} registros`}
        {siguiente ? " en esta página" : ""}
      </p>

      {filas.length ? (
        <ListaVerMas
          etiqueta="Acciones registradas"
          elementos={filas.map((f) => (
            <div
              key={f.id}
              className="flex flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <span className="text-pequeno text-texto-secundario">
                {f.fecha} · {f.responsable}
              </span>
              <span className="self-start rounded-control bg-fondo-info px-3 py-1 font-bold text-texto-info">
                {f.modulo}
              </span>
              <strong>{f.texto}</strong>
              {f.detalle && <span className="break-words text-texto-secundario">{f.detalle}</span>}
              <span className="inline-flex items-center gap-2 text-pequeno text-texto-secundario">
                <Lock aria-hidden className="size-icono-pequeno shrink-0" />
                Solo lectura
              </span>
            </div>
          ))}
        />
      ) : (
        <p>No hay acciones con esos filtros.</p>
      )}

      <div className="flex flex-col gap-separacion md:flex-row">
        {antes && (
          <Link href={enlace(filtros, {})} className={clasesBoton("secundario")}>
            <ChevronLeft aria-hidden className="size-icono shrink-0" />
            <span>Volver a las más recientes</span>
          </Link>
        )}
        {siguiente && (
          <Link href={enlace(filtros, { antes: siguiente })} className={clasesBoton("secundario")}>
            <span>Ver las anteriores</span>
            <ChevronRight aria-hidden className="size-icono shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}
