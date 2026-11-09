import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BalanceDeActividad } from "@/app/_actividades/BalanceDeActividad";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { Volver } from "@/componentes/a11y/Volver";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { fechaLarga, horaCorta } from "@/compartido/fechas";
import { miColaboracion, verActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { miVoluntariado } from "@/modulos/asambleas/aplicacion/voluntarios";
import { balanceDeLaActividad } from "@/modulos/transparencia/aplicacion/balances";
import { SubirComprobante } from "../SubirComprobante";

export const metadata: Metadata = { title: "Actividad pro-fondos" };

// VEC-ASA-13 y VEC-TRA-03 (HU-ASA-08, 09 y 12): una actividad pro-fondos. Si es próxima, cómo colaborar y el aporte de la
// casa; cuando la directiva publica su balance, cuánto se juntó y en qué se gastó (sin los comprobantes).
export default async function Actividad({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const { id } = await params;
  const actividad = await verActividad(sesion, id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  const [aporte, ayuda, balance] = await Promise.all([
    miColaboracion(sesion, id),
    miVoluntariado(sesion, id),
    balanceDeLaActividad(sesion, id),
  ]);
  const fecha = new Date(actividad.fechaHora);
  const proxima = fecha > new Date();
  // Una actividad que ya se hizo y todavía no tiene su balance publicado no se muestra a los vecinos.
  if (!proxima && !balance) notFound();
  const unidad = aporte ? (aporte.cantidad === 1 ? actividad.unidad.singular : actividad.unidad.plural) : "";
  const paraQue = actividad.paraQue.endsWith(".") ? actividad.paraQue : `${actividad.paraQue}.`;
  return (
    <div className="flex flex-col gap-6">
      <Volver href="/actividades">Volver a actividades</Volver>
      <div className="flex flex-col gap-2">
        <p className="text-pequeno font-bold text-texto-secundario">
          {fechaLarga(fecha)} · {horaCorta(fecha)} · {actividad.lugar}
        </p>
        <h1 className="text-titulo-1">{actividad.nombre}</h1>
        <p>
          {paraQue} Colaboración: {actividad.precioTexto} por {actividad.unidad.singular}.
        </p>
      </div>
      {proxima && (
        <Tarjeta titulo="Su aporte">
          {aporte ? (
            <>
              <MensajeEstado tipo="info" titulo="Usted ya registró su aporte">
                <p>
                  {aporte.cantidad} {unidad} · {aporte.montoTexto} ·{" "}
                  {aporte.modalidad === "ANTICIPADA"
                    ? "pago antes con Yape o Plin"
                    : "pago en persona el día de la actividad"}
                  .
                </p>
              </MensajeEstado>
              {aporte.modalidad === "ANTICIPADA" && (
                <SubirComprobante actividadId={id} tieneComprobante={aporte.tieneComprobante} />
              )}
            </>
          ) : ayuda && ayuda.estado !== "NO_APROBADO" ? (
            ayuda.estado === "APROBADO" ? (
              <MensajeEstado tipo="exito" titulo="Ayuda aprobada">
                <p>Su rol: {ayuda.rolAsignado}. Su casa no paga la colaboración.</p>
              </MensajeEstado>
            ) : (
              <MensajeEstado tipo="info" titulo="Usted ofreció su ayuda">
                <p>La directiva revisará su ofrecimiento y le avisará.</p>
              </MensajeEstado>
            )
          ) : (
            <>
              {ayuda?.estado === "NO_APROBADO" && (
                <MensajeEstado tipo="aviso" titulo="Su ayuda no se aprobó por ahora">
                  <p>Si quiere, puede colaborar pagando.</p>
                </MensajeEstado>
              )}
              <BotonEnlace href={`/actividades/colaborar?actividad=${id}`} anchoCompleto>
                Colaborar con la actividad
              </BotonEnlace>
            </>
          )}
        </Tarjeta>
      )}
      {balance ? (
        <BalanceDeActividad
          cuentas={{
            ingresosVirtuales: balance.ingresosVirtuales,
            ingresosEnPuerta: balance.ingresosEnPuerta,
            gastos: balance.egresos.map((e) => ({
              concepto: e.concepto,
              monto: e.monto,
              comprobanteId: null,
            })),
          }}
        />
      ) : null}
    </div>
  );
}
