import { Info } from "lucide-react";
import type { Metadata } from "next";
import { sesionActual } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { soles } from "@/compartido/dinero";
import { fechaLarga, horaCorta } from "@/compartido/fechas";
import { miColaboracion, proximaActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { balancesPublicados } from "@/modulos/transparencia/aplicacion/balances";
import { SubirComprobante } from "./SubirComprobante";

export const metadata: Metadata = { title: "Actividades pro-fondos" };

// VEC-ASA-13 (HU-ASA-08): la próxima actividad, el aporte de la casa y las actividades anteriores (con su balance).
export default async function Actividades() {
  const sesion = await sesionActual();
  const actividad = sesion ? await proximaActividad(sesion) : null;
  const aporte = sesion && actividad ? await miColaboracion(sesion, actividad.id) : null;
  const anteriores = sesion ? await balancesPublicados(sesion) : [];
  const fecha = actividad ? new Date(actividad.fechaHora) : null;
  const unidad =
    actividad && aporte ? (aporte.cantidad === 1 ? actividad.unidad.singular : actividad.unidad.plural) : "";
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Actividades pro-fondos</h1>
        <p>Eventos para juntar fondos para el barrio. Puede colaborar pagando o ayudando como voluntaria.</p>
      </div>
      {actividad && fecha ? (
        <section
          aria-labelledby="titulo-proxima"
          className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
        >
          <p className="text-pequeno text-texto-secundario">Próxima actividad</p>
          <h2 id="titulo-proxima" className="text-titulo-2">
            {actividad.nombre}
          </h2>
          <p className="font-bold">{fechaLarga(fecha)}</p>
          <p>
            {horaCorta(fecha)} · {actividad.lugar}
          </p>
          <p>
            {actividad.paraQue.endsWith(".") ? actividad.paraQue : `${actividad.paraQue}.`} Colaboración:{" "}
            {actividad.precioTexto} por {actividad.unidad.singular}.
          </p>
          {aporte ? (
            <div className="flex flex-col gap-3 pt-2">
              <MensajeEstado tipo="info" titulo="Usted ya registró su aporte">
                <p>
                  {aporte.cantidad} {unidad} · {aporte.montoTexto} ·{" "}
                  {aporte.modalidad === "ANTICIPADA"
                    ? "pago antes con Yape o Plin"
                    : "pago en la puerta el día de la actividad"}
                  .
                </p>
              </MensajeEstado>
              {aporte.modalidad === "ANTICIPADA" && (
                <SubirComprobante actividadId={actividad.id} tieneComprobante={aporte.tieneComprobante} />
              )}
            </div>
          ) : (
            <div className="pt-2">
              <BotonEnlace href="/actividades/colaborar">Colaborar con la actividad</BotonEnlace>
            </div>
          )}
        </section>
      ) : (
        <MensajeEstado tipo="info" titulo="No hay actividades por ahora">
          <p>Cuando la directiva organice una, la verá aquí y le avisaremos.</p>
        </MensajeEstado>
      )}
      {anteriores.length > 0 && (
        <section aria-labelledby="titulo-anteriores" className="flex flex-col gap-3">
          <h2 id="titulo-anteriores" className="text-titulo-2">
            Actividades anteriores
          </h2>
          <ListaVerMas
            etiqueta="Actividades anteriores"
            normal={3}
            senior={2}
            elementos={anteriores.map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <p className="font-bold">{b.titulo}</p>
                <p className="flex items-center gap-2 text-texto-secundario">
                  <Info aria-hidden className="size-icono-pequeno shrink-0" />
                  Se juntó {soles(b.totales.ingresos)} · saldo final {soles(b.totales.utilidadNeta)}
                </p>
                <BotonEnlace href={`/transparencia/balances/${b.id}`} variante="secundario">
                  Ver el balance
                </BotonEnlace>
              </div>
            ))}
          />
        </section>
      )}
    </div>
  );
}
