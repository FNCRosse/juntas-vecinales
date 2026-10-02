import { ChevronLeft, CircleCheck, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirActor } from "@/app/_sesion/sesion";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { primerNombre } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { verVisitaEnGarita } from "@/modulos/identidad/aplicacion/garita";
import { RefrescarSolo } from "../../_componentes/RefrescarSolo";
import { AccionGarita } from "../_componentes/AccionGarita";

export const metadata: Metadata = { title: "Visita en la garita" };

const ACCESOS = "/api/garita/accesos";

function Dato({ termino, children }: { termino: string; children: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-pequeno text-texto-secundario">{termino}</dt>
      <dd className="font-bold">{children}</dd>
    </div>
  );
}

const enlaceBitacora = (nombre: string) =>
  `/garita/bitacora?${new URLSearchParams({ aviso: "visita", nombre })}`;

// VIG-VIS-02 (anunciada: puede pasar), VIG-VIS-04 (esperando la respuesta de la casa) y VIG-VIS-05
// (la casa respondió: anotar la entrada), de HU-GAR-07 y HU-GAR-08 CA1.
export default async function VisitaEnGarita({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["VIGILANTE"], "/entrar/equipo");
  const v = await verVisitaEnGarita(sesion, (await params).id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  const casa = v.avisadoA.length === 1 ? primerNombre(v.avisadoA[0].nombre) : "la casa";

  const volver = (
    <Link
      href="/garita/visitas"
      className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
    >
      <ChevronLeft aria-hidden className="size-icono" />
      Volver a visitas
    </Link>
  );

  if (v.estado === "LLEGO" || v.estado === "NO_ENTRO") {
    return (
      <div className="flex flex-col gap-6">
        {volver}
        <h1 className="text-titulo-1">{v.nombre}</h1>
        <MensajeEstado
          tipo={v.estado === "LLEGO" ? "exito" : "info"}
          titulo={v.estado === "LLEGO" ? "Su entrada ya está anotada" : "Quedó anotado que no entró"}
        />
        <BotonEnlace href="/garita/bitacora" variante="secundario">
          Ver la bitácora
        </BotonEnlace>
      </div>
    );
  }

  if (v.anunciada) {
    if (!v.enLaLista) {
      return (
        <div className="flex flex-col gap-6">
          {volver}
          <h1 className="text-titulo-1">{v.nombre}</h1>
          <MensajeEstado tipo="aviso" titulo="Esta visita ya no está en la lista">
            <p>El vecino la anuló o ya pasó su horario. Pregunte a la casa si la deja pasar.</p>
          </MensajeEstado>
          <BotonEnlace href={`/garita/visitas/nueva?${new URLSearchParams({ nombre: v.nombre })}`}>
            Preguntar al vecino
          </BotonEnlace>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-6">
        {volver}
        <p className="inline-flex items-center gap-2 self-start rounded-control bg-fondo-exito px-3 py-2 font-bold text-texto-exito">
          <CircleCheck aria-hidden className="size-icono shrink-0" />
          Visita anunciada
        </p>
        <h1 className="text-titulo-1">{v.nombre} puede pasar</h1>
        <section className="flex flex-col gap-4 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Dato termino="Va a">{v.vivienda}</Dato>
            <Dato termino="Horario">{v.cuando}</Dato>
            <Dato termino="Vehículo">{v.vehiculo}</Dato>
            <Dato termino="Anotada por">{v.anotadaPor}</Dato>
          </dl>
          <p className="text-texto-secundario">
            Estos datos los dejó el vecino. No hace falta pedirlos de nuevo.
          </p>
        </section>
        {v.llegaAHora ? (
          <>
            <AccionGarita
              ruta={ACCESOS}
              cuerpo={{ accion: "llegada_anunciada", visitaId: v.id }}
              icono="puerta"
              destino={enlaceBitacora(v.nombre)}
            >
              Dejar pasar y anotar la entrada
            </AccionGarita>
            <p>Le avisaremos al vecino que su visita llegó.</p>
          </>
        ) : (
          <MensajeEstado tipo="aviso" titulo="Llegó antes de su hora">
            <p>Puede pasar desde las {v.puedePasarDesde}. Si no quiere esperar, pregunte a la casa.</p>
          </MensajeEstado>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {v.estado === "ESPERANDO_RESPUESTA" && <RefrescarSolo segundos={5} />}
      {volver}
      <div className="flex flex-col gap-2">
        <span className="text-texto-secundario">Paso 2 de 2</span>
        <h1 className="text-titulo-1">
          {v.nombre} · para {v.vivienda}
        </h1>
        <p>
          {v.motivo} · {v.vehiculo.toLowerCase()}
        </p>
      </div>

      {v.estado === "ESPERANDO_RESPUESTA" && (
        <>
          <MensajeEstado tipo="info" titulo={`Esperando la respuesta de ${casa}`}>
            <p>
              Le enviamos el aviso a las {v.avisadoEn}. Mientras tanto, pídale a la visita que espere afuera.
              Esta pantalla se actualiza sola.
            </p>
          </MensajeEstado>
          {v.avisadoA
            .filter((p) => p.telefono)
            .map((p) => (
              <a
                key={p.nombre}
                href={`tel:+51${p.telefono?.replace(/\s/g, "")}`}
                className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
              >
                <Phone aria-hidden className="size-icono" />
                Llamar a {p.nombre} ({p.telefono})
              </a>
            ))}
          <section className="flex flex-col gap-4">
            <h2 className="text-titulo-3">Si le respondieron por teléfono, marque qué dijeron</h2>
            <div className="flex flex-col gap-separacion md:flex-row">
              <AccionGarita
                ruta={`/api/garita/visitas/${v.id}`}
                metodo="PATCH"
                cuerpo={{ autoriza: true, via: "telefono" }}
                icono="si"
                variante="secundario"
              >
                Sí puede pasar
              </AccionGarita>
              <AccionGarita
                ruta={`/api/garita/visitas/${v.id}`}
                metodo="PATCH"
                cuerpo={{ autoriza: false, via: "telefono" }}
                icono="no"
                variante="secundario"
              >
                No puede pasar
              </AccionGarita>
            </div>
          </section>
          <AccionGarita
            ruta={ACCESOS}
            cuerpo={{ accion: "no_entro", visitaId: v.id }}
            variante="secundario"
            destino="/garita/bitacora"
          >
            La visita se fue: anotar que no entró
          </AccionGarita>
        </>
      )}

      {v.estado === "AUTORIZADA" && (
        <>
          <MensajeEstado
            tipo="exito"
            titulo={`${casa === "la casa" ? "La casa" : casa} dijo que sí puede pasar`}
          >
            <p>Respondió {v.respondidaPor}.</p>
          </MensajeEstado>
          <AccionGarita
            ruta={ACCESOS}
            cuerpo={{ accion: "entrada_visita", visitaId: v.id }}
            icono="puerta"
            destino={enlaceBitacora(v.nombre)}
          >
            Dejar pasar y anotar la entrada
          </AccionGarita>
        </>
      )}

      {v.estado === "NO_AUTORIZADA" && (
        <>
          <MensajeEstado
            tipo="aviso"
            titulo={`${casa === "la casa" ? "La casa" : casa} dijo que no puede pasar`}
          >
            <p>Respondió {v.respondidaPor}. No la deje pasar.</p>
          </MensajeEstado>
          <AccionGarita
            ruta={ACCESOS}
            cuerpo={{ accion: "no_entro", visitaId: v.id }}
            icono="no"
            destino="/garita/bitacora"
          >
            Anotar que no entró
          </AccionGarita>
        </>
      )}
    </div>
  );
}
