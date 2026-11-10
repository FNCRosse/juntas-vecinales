import { CircleCheck, DoorOpen, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { EncabezadoPagina } from "@/componentes/a11y/EncabezadoPagina";
import { Insignia } from "@/componentes/a11y/Insignia";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { visitaEnLaPuerta } from "@/modulos/identidad/aplicacion/garita";
import { misVisitas } from "@/modulos/identidad/aplicacion/visitas";

export const metadata: Metadata = { title: "Mis visitas" };

const TARJETA =
  "flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6";
const SUAVE = "rounded-tarjeta bg-fondo-suave p-4 senior:p-6";

// VEC-GAR-01 Mis visitas (HU-GAR-04, HU-GAR-05): cada visita programada en su tarjeta, con "Anular" apartado
// del resto, y las que llegaron hace poco. Arriba, la visita no anunciada que espera su respuesta en la garita (VEC-34).
export default async function MisVisitas({ searchParams }: { searchParams: Promise<{ anulada?: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const [{ programadas, llegaron, puedeRegistrar }, enLaPuerta] = await Promise.all([
    misVisitas(sesion),
    visitaEnLaPuerta(sesion),
  ]);
  const { anulada } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Mis visitas"
        descripcion="Las personas de esta lista entran sin esperar: el vigilante ya sabe que vienen a su casa."
        accion={
          <BotonEnlace
            href="/visitas/nueva"
            variante={puedeRegistrar ? "primario" : "secundario"}
            icono={UserPlus}
            anchoCompleto
          >
            Registrar una visita
          </BotonEnlace>
        }
      />
      {enLaPuerta && (
        <MensajeEstado
          tipo="info"
          icono={DoorOpen}
          titulo={`${enLaPuerta.nombre} está en la garita y pregunta por usted`}
        >
          <p>No estaba anunciado. {enLaPuerta.vigilante}, el vigilante, espera su respuesta.</p>
          <BotonEnlace href={`/visitas/${enLaPuerta.id}/responder`} variante="secundario" anchoCompleto>
            Responder
          </BotonEnlace>
        </MensajeEstado>
      )}
      {anulada && (
        <MensajeEstado tipo="exito" titulo={`Anulamos la visita de ${anulada}`}>
          <p>
            El vigilante ya no la ve en la lista. Si igual llega, le preguntarán a usted antes de dejarla
            pasar.
          </p>
        </MensajeEstado>
      )}
      <section aria-labelledby="programadas" className="flex flex-col gap-separacion">
        <h2 id="programadas" className="text-titulo-3">
          Visitas programadas
        </h2>
        {programadas.length ? (
          <ListaVerMas
            etiqueta="Visitas programadas"
            elementos={programadas.map((v) => (
              <article key={v.id} className={TARJETA}>
                <strong className="text-titulo-3">{v.nombre}</strong>
                <span>{v.cuando}</span>
                <span className="text-texto-secundario">{v.vehiculo}</span>
                <Insignia tono="exito" icono={CircleCheck}>
                  En la lista de la garita
                </Insignia>
                <div className="mt-6 flex">
                  <BotonEnlace href={`/visitas/${v.id}/anular`} variante="peligroContorno" compacto>
                    Anular esta visita<span className="sr-only"> de {v.nombre}</span>
                  </BotonEnlace>
                </div>
              </article>
            ))}
          />
        ) : (
          <div className={`flex flex-col gap-1 ${SUAVE}`}>
            <strong>No tiene visitas programadas</strong>
            <span className="text-texto-secundario">
              Si espera a alguien, regístrelo y entrará sin demora.
            </span>
          </div>
        )}
      </section>
      {llegaron.length > 0 && (
        <section aria-labelledby="llegaron" className="flex flex-col gap-separacion">
          <h2 id="llegaron" className="text-titulo-3">
            Llegaron hace poco
          </h2>
          <ul className="flex flex-col gap-separacion">
            {llegaron.map((v) => (
              <li key={v.id} className={`flex items-start gap-3 ${SUAVE}`}>
                <DoorOpen aria-hidden className="size-icono shrink-0" />
                <span className="flex flex-col">
                  <strong>{v.nombre}</strong>
                  <span className="text-texto-secundario">
                    Entró el {fechaYHora(new Date(v.llegoEn ?? ""))} · estaba en su lista
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
