import {
  CalendarDays,
  ChartColumn,
  ChevronRight,
  CircleCheck,
  CirclePlus,
  Inbox,
  Info,
  type LucideIcon,
  OctagonAlert,
  Plus,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { sesionActual } from "@/app/_sesion/sesion";
import { soles } from "@/compartido/dinero";
import { fechaLarga, horaCorta, primerNombre, saludo } from "@/compartido/fechas";
import { BarraQuorum } from "@/componentes/a11y/BarraQuorum";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { Cifra } from "@/componentes/a11y/Cifra";
import { EncabezadoPagina } from "@/componentes/a11y/EncabezadoPagina";
import { Insignia, type TonoInsignia } from "@/componentes/a11y/Insignia";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { consultarTablero, opcionesDelTablero } from "@/modulos/aportes/aplicacion/tablero";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { rendicionDeCuentas } from "@/modulos/transparencia/aplicacion/caja";
import { bandejasDeLaDirectiva } from "./_bandejas";
import { Cuadre } from "./cobros/recaudacion/Cuadre";

export const metadata: Metadata = { title: "Resumen de la directiva" };

/** Fila de "Estado de las casas": qué es, cuántas y una insignia con ícono y texto. */
function FilaEstado({
  nombre,
  casas,
  tono,
  icono,
  insignia,
}: {
  nombre: string;
  casas: number;
  tono: TonoInsignia;
  icono: LucideIcon;
  insignia: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-borde-sutil py-3">
      <span className="flex flex-col">
        <strong>{nombre}</strong>
        <span>{casas} casas</span>
      </span>
      <Insignia tono={tono} icono={icono}>
        {insignia}
      </Insignia>
    </li>
  );
}

// DIR-INI-01 Resumen de la directiva (prototipo DIN01): crear o registrar, lo que hay por atender (el detalle está en
// "Para atender"), la recaudación del mes y la próxima asamblea con su quórum.
export default async function ResumenDirectiva() {
  const sesion = await sesionActual();
  const ahora = new Date();
  const proxima = sesion ? await proximaAsamblea(sesion, ahora) : null;
  const recaudacion = sesion && (await consultarTablero(sesion, {}, ahora));
  const cuentas = sesion && (await rendicionDeCuentas(sesion, undefined));
  const bandejas = sesion && (await bandejasDeLaDirectiva(sesion, ahora));
  const mes = opcionesDelTablero(undefined, ahora).periodo.etiqueta;
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo={`${saludo(ahora)}, ${primerNombre(sesion?.nombreCompleto ?? "")}`}
        descripcion={`${fechaLarga(ahora)} · Resumen de la directiva`}
        accion={
          <div className="hidden lg:block">
            <BotonEnlace href="/directiva/crear?desde=resumen" icono={Plus}>
              Crear o registrar
            </BotonEnlace>
          </div>
        }
      />

      <div className="lg:hidden">
        <Tarjeta titulo="Crear o registrar" icono={CirclePlus}>
          <p className="text-texto-secundario">
            Asambleas, actividades pro-fondos, comunicados e ingresos o gastos.
          </p>
          <BotonEnlace href="/directiva/crear?desde=resumen" icono={Plus} anchoCompleto>
            Crear o registrar
          </BotonEnlace>
        </Tarjeta>
      </div>

      <div
        data-ancho="completo"
        className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start"
      >
        {bandejas && (
          <div className="lg:col-start-1 lg:row-start-1">
            <Tarjeta titulo="Para atender" icono={Inbox}>
              <strong className="text-grande">{bandejas.texto}</strong>
              {bandejas.conPendiente.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {bandejas.conPendiente.slice(0, 3).map(({ icono: Icono, titulo, n }) => (
                    <li key={titulo} className="flex items-center gap-2">
                      <Icono aria-hidden className="size-icono shrink-0 text-accion-primaria" />
                      <span>
                        {titulo}: <strong>{n}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <BotonEnlace href="/directiva/para-atender" icono={Inbox} anchoCompleto>
                Ver lo que hay que atender
              </BotonEnlace>
            </Tarjeta>
          </div>
        )}

        <div className="flex flex-col gap-6 md:grid md:grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] md:items-start lg:contents">
          {recaudacion && cuentas && (
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <Tarjeta titulo="Recaudación" icono={Wallet}>
                <p className="text-texto-secundario">{mes}</p>
                <div className="grid grid-cols-2 gap-separacion">
                  <Cifra
                    titulo="Se cobró"
                    valor={soles(recaudacion.seCobro)}
                    detalle={`${recaudacion.recibos} recibos`}
                  />
                  <Cifra titulo="Se gastó" valor={soles(cuentas.gastos)} />
                  <Cifra titulo="Saldo de caja" valor={soles(cuentas.saldo)} />
                  <Cifra
                    titulo="Falta cobrar"
                    valor={soles(recaudacion.faltaCobrar.monto)}
                    detalle={`${recaudacion.faltaCobrar.cuotas} cuotas semanales`}
                  />
                </div>
                <Cuadre t={recaudacion} enLinea />
                <strong>Estado de las casas</strong>
                <ul className="flex flex-col">
                  <FilaEstado
                    nombre="Al día"
                    casas={recaudacion.casas.alDia}
                    tono="exito"
                    icono={CircleCheck}
                    insignia="Al día"
                  />
                  <FilaEstado
                    nombre="Atraso de 1 a 7 semanas"
                    casas={recaudacion.casas.atraso}
                    tono="aviso"
                    icono={TriangleAlert}
                    insignia="Advertencia"
                  />
                  <FilaEstado
                    nombre="8 semanas o más"
                    casas={recaudacion.casas.critico}
                    tono="error"
                    icono={OctagonAlert}
                    insignia="Atraso crítico"
                  />
                </ul>
                <BotonEnlace
                  href="/directiva/cobros/recaudacion"
                  variante="secundario"
                  icono={ChartColumn}
                  compacto
                >
                  Ver la recaudación completa
                </BotonEnlace>
              </Tarjeta>
            </div>
          )}

          <div className="lg:col-start-1 lg:row-start-2">
            <Tarjeta titulo="Próxima asamblea" icono={CalendarDays}>
              {proxima ? (
                <>
                  <span className="text-titulo-2 font-bold leading-titulo">
                    {fechaLarga(new Date(proxima.fechaHora), { conAnio: false })}
                  </span>
                  <span>
                    {horaCorta(new Date(proxima.fechaHora))} · {proxima.lugar}
                  </span>
                  <strong>
                    Quórum proyectado: {proxima.confirmados.total} de {proxima.padronTotal} casas
                  </strong>
                  <BarraQuorum
                    confirmados={proxima.quorum.confirmados}
                    padronTotal={proxima.padronTotal}
                    requerido={proxima.quorumRequerido}
                    alcanza={proxima.quorum.alcanza}
                  />
                  <span className="text-pequeno text-texto-secundario">
                    La línea marca el mínimo: {proxima.quorumRequerido} casas (la mitad del padrón más una).
                  </span>
                  <Insignia
                    tono={proxima.quorum.alcanza ? "exito" : "info"}
                    icono={proxima.quorum.alcanza ? CircleCheck : Info}
                  >
                    {proxima.quorum.alcanza ? "Quórum proyectado suficiente" : "Todavía no alcanza el quórum"}
                  </Insignia>
                  <Link
                    href="/directiva/asambleas"
                    className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
                  >
                    Ver la asamblea
                    <ChevronRight aria-hidden className="size-icono shrink-0" />
                  </Link>
                </>
              ) : (
                <p>No hay ninguna asamblea convocada.</p>
              )}
            </Tarjeta>
          </div>
        </div>
      </div>
    </div>
  );
}
