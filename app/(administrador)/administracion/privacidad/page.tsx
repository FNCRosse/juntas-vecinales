import { Check, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { clasesBoton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { bandejaArco, type FilaArco, TIPOS_ARCO, type TipoArco } from "@/modulos/identidad/aplicacion/arco";

export const metadata: Metadata = { title: "Solicitudes de privacidad" };

const FILTROS: { valor?: TipoArco; texto: string }[] = [
  { texto: "Todas" },
  ...(Object.keys(TIPOS_ARCO) as TipoArco[]).map((valor) => ({ valor, texto: TIPOS_ARCO[valor] })),
];

const ESTILO_INSIGNIA: Record<FilaArco["insignia"]["tipo"], string> = {
  exito: "bg-fondo-exito text-texto-exito",
  aviso: "bg-fondo-aviso text-texto-aviso",
  error: "bg-fondo-error text-texto-error",
  info: "bg-fondo-info text-texto-info",
};

// ADM-ARC-01 Solicitudes de privacidad (HU-GAR-16 CA1 y CA2): bandeja única por tipo, con el tiempo
// transcurrido en días hábiles y la alerta de vencimiento.
export default async function SolicitudesDePrivacidad({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; aviso?: string; numero?: string }>;
}) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const { tipo, aviso, numero } = await searchParams;
  const filtro = tipo && tipo in TIPOS_ARCO ? (tipo as TipoArco) : undefined;
  const filas = await bandejaArco(sesion, filtro);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Solicitudes de privacidad</h1>
        <p>
          Pedidos de acceso, rectificación, cancelación y oposición de los vecinos (Ley N.° 29733). Se cuentan
          los días hábiles desde que llegó cada pedido.
        </p>
      </div>
      {aviso === "resuelta" && numero && (
        <MensajeEstado tipo="exito" titulo={`Resolvimos la solicitud ${numero}`}>
          <p>Quedó en la auditoría y le avisamos al vecino.</p>
        </MensajeEstado>
      )}
      <nav aria-label="Filtrar por tipo" className="flex flex-wrap gap-separacion">
        {FILTROS.map((f) => {
          const activo = filtro === f.valor;
          return (
            <Link
              key={f.texto}
              href={f.valor ? `/administracion/privacidad?tipo=${f.valor}` : "/administracion/privacidad"}
              aria-current={activo ? "page" : undefined}
              className={clasesBoton(activo ? "primario" : "secundario")}
            >
              {activo && <Check aria-hidden className="size-icono shrink-0" />}
              <span>{f.texto}</span>
            </Link>
          );
        })}
      </nav>
      {filas.length ? (
        <ul className="flex flex-col gap-separacion">
          {filas.map((f) => (
            <li
              key={f.id}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <span className="text-pequeno text-texto-secundario">
                N.° {f.numero} · {f.tipoTexto} · recibida el {f.recibida}
              </span>
              <strong className="text-titulo-3">{f.titulo}</strong>
              <span>{f.quien}</span>
              <span className="text-texto-secundario">{f.plazoTexto}</span>
              <span
                className={`self-start rounded-control px-3 py-1 font-bold ${ESTILO_INSIGNIA[f.insignia.tipo]}`}
              >
                {f.insignia.texto}
              </span>
              {f.pendiente && (
                <Link
                  href={`/administracion/privacidad/${f.id}`}
                  className={`${clasesBoton("primario")} self-start`}
                >
                  <span>
                    Resolver<span className="sr-only"> la solicitud {f.numero}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-icono shrink-0" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay solicitudes{filtro ? ` de ${TIPOS_ARCO[filtro].toLowerCase()}` : ""}.</p>
      )}
    </div>
  );
}
