import { ArrowRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BalanceDeActividad, type Cuentas } from "@/app/_actividades/BalanceDeActividad";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { Volver } from "@/componentes/a11y/Volver";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { fechaLarga, horaCorta } from "@/compartido/fechas";
import { verActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { resumenDeActividad } from "@/modulos/asambleas/aplicacion/movimientosActividad";
import { voluntariosDeLaActividad } from "@/modulos/asambleas/aplicacion/voluntarios";
import { balanceDeLaActividad } from "@/modulos/transparencia/aplicacion/balances";
import { Voluntarios } from "../_componentes/Voluntarios";

export const metadata: Metadata = { title: "Ingresos y gastos de la actividad" };

// DIR-ASA-12 y DIR-ASA-13 (prototipo DAS09, HU-ASA-09 y 10): cómo va una actividad pro-fondos. Antes de publicar, las cuentas
// salen de lo anotado (gastos con comprobante y cobros en la puerta) y de los pagos anticipados; con el balance publicado,
// del balance, que ya no cambia.
export default async function DetalleActividad({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const { id } = await params;
  const actividad = await verActividad(sesion, id).catch((error) => {
    if (error instanceof ErrorNoEncontrado) notFound();
    throw error;
  });
  const [resumen, balance, voluntarios] = await Promise.all([
    resumenDeActividad(sesion, id),
    balanceDeLaActividad(sesion, id),
    voluntariosDeLaActividad(sesion, id),
  ]);
  const fecha = new Date(actividad.fechaHora);
  const yaSeHizo = fecha <= new Date();
  const cuentas: Cuentas = balance
    ? {
        ingresosVirtuales: balance.ingresosVirtuales,
        ingresosEnPuerta: balance.ingresosEnPuerta,
        gastos: balance.egresos.map((e) => ({
          concepto: e.concepto,
          monto: e.monto,
          comprobanteId: e.comprobanteId,
        })),
      }
    : {
        ingresosVirtuales: resumen.totales.ingresosVirtuales,
        ingresosEnPuerta: resumen.totales.ingresosEnPuerta,
        gastos: resumen.gastos.map((g) => ({
          concepto: g.concepto,
          monto: g.monto,
          comprobanteId: g.archivoId,
        })),
      };
  return (
    <div className="flex flex-col gap-6">
      <Volver href="/directiva/actividades">Volver a actividades</Volver>
      <div className="flex flex-col gap-2">
        <p className="text-pequeno font-bold text-texto-secundario">
          {fechaLarga(fecha)} · {horaCorta(fecha)} · {actividad.lugar}
        </p>
        <h1 className="text-titulo-1">{actividad.nombre}: ingresos y gastos</h1>
        <p className="text-texto-secundario">
          {resumen.unidadesTexto} a {actividad.precioTexto}.
          {resumen.porAdelantado.sinComprobante > 0 &&
            ` ${resumen.porAdelantado.sinComprobante} pago${resumen.porAdelantado.sinComprobante === 1 ? "" : "s"} por adelantado sin comprobante todavía no cuenta${resumen.porAdelantado.sinComprobante === 1 ? "" : "n"}.`}
        </p>
      </div>
      <BalanceDeActividad
        cuentas={cuentas}
        accion={
          !balance && (
            <BotonEnlace
              href={`/directiva/actividades/${id}/registrar`}
              variante="secundario"
              icono={Plus}
              anchoCompleto
            >
              Registrar un gasto o ingreso de la actividad
            </BotonEnlace>
          )
        }
      />
      <Voluntarios pide={actividad.pideVoluntarios} voluntarios={voluntarios} />
      <div data-ancho="completo" className="flex flex-col gap-3">
        {balance ? (
          <MensajeEstado tipo="exito" titulo="Balance publicado">
            <p>Está en Actas y balances de los vecinos. Ya no se puede modificar.</p>
          </MensajeEstado>
        ) : yaSeHizo ? (
          <BotonEnlace href={`/directiva/actividades/${id}/publicar`} icono={ArrowRight} anchoCompleto>
            Revisar y publicar el balance
          </BotonEnlace>
        ) : (
          <p className="text-texto-secundario">
            El balance se publica después de la actividad. Mientras tanto puede ir anotando los gastos.
          </p>
        )}
      </div>
    </div>
  );
}
