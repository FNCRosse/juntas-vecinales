import { Check, ChevronLeft, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { clasesBoton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { bitacora } from "@/modulos/identidad/aplicacion/garita";
import { AccionGarita } from "../visitas/_componentes/AccionGarita";

export const metadata: Metadata = { title: "Bitácora de la garita" };

const FILTROS = [
  { ver: "todo", texto: "Todo el día" },
  { ver: "dentro", texto: "Dentro ahora" },
] as const;

// VIG-BIT-01 Bitácora de la garita (HU-GAR-08): entradas y salidas de hoy, quién sigue dentro con la
// alerta de las 6 horas (CA2) y filas que no se editan ni se borran (CA3).
export default async function Bitacora({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; aviso?: string; nombre?: string }>;
}) {
  const sesion = await exigirActor(["VIGILANTE"], "/entrar/equipo");
  const { ver = "todo", aviso, nombre } = await searchParams;
  const { filas, dentro } = await bitacora(sesion);
  const lista = ver === "dentro" ? dentro : filas;
  const sigueDentro = new Set(dentro.map((f) => f.id));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/garita"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al inicio
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Bitácora de la garita</h1>
        <p>Entradas y salidas de hoy. No se pueden editar ni borrar: así sirven como prueba.</p>
      </div>
      {aviso === "emergencia" && (
        <MensajeEstado tipo="exito" titulo="Reja abierta por emergencia">
          <p>Quedó en la bitácora y avisamos a la directiva.</p>
        </MensajeEstado>
      )}
      {aviso === "visita" && nombre && (
        <MensajeEstado tipo="exito" titulo={`${nombre} pasó`}>
          <p>Anotamos su entrada.</p>
        </MensajeEstado>
      )}
      {dentro
        .filter((f) => f.alerta)
        .map((f) => (
          <MensajeEstado key={f.id} tipo="aviso" titulo={`${f.placa ?? f.quien} lleva más de 6 horas dentro`}>
            <p>
              Entró a las {f.hora} a {f.vivienda} y no es de un vecino. Pregunte en esa casa o avise a la
              directiva.
            </p>
          </MensajeEstado>
        ))}

      <nav aria-label="Filtrar bitácora" className="flex flex-wrap gap-separacion">
        {FILTROS.map((filtro) => {
          const activo = ver === filtro.ver;
          return (
            <Link
              key={filtro.ver}
              href={`/garita/bitacora?ver=${filtro.ver}`}
              aria-current={activo ? "page" : undefined}
              className={clasesBoton(activo ? "primario" : "secundario")}
            >
              {activo && <Check aria-hidden className="size-icono shrink-0" />}
              <span>{filtro.texto}</span>
            </Link>
          );
        })}
      </nav>

      {lista.length ? (
        <ul className="flex flex-col gap-4">
          {lista.map((f) => (
            <li
              key={f.id}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <strong className="text-titulo-3">{f.hora}</strong>
                <span className="text-texto-secundario">
                  {f.salida ? `Salió a las ${f.salida}` : f.modo === "NO_ENTRO" ? "No entró" : "Sigue dentro"}
                </span>
              </div>
              <strong>{f.quien}</strong>
              <span>
                {f.placa ?? "A pie"} · {f.vivienda}
              </span>
              <span className="text-texto-secundario">{f.descripcion}</span>
              <span className="inline-flex items-center gap-2 text-pequeno text-texto-secundario">
                <Lock aria-hidden className="size-icono-pequeno shrink-0" />
                Registro protegido: no se edita ni se borra
              </span>
              {sigueDentro.has(f.id) && (
                <AccionGarita
                  ruta="/api/garita/accesos"
                  cuerpo={{ accion: "salida", entradaId: f.id }}
                  icono="salida"
                  variante="secundario"
                >
                  {`Marcar salida de ${f.quien}`}
                </AccionGarita>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>{ver === "dentro" ? "No hay nadie dentro por ahora." : "Todavía no hay entradas hoy."}</p>
      )}
    </div>
  );
}
