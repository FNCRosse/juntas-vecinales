import { Bell, ChevronRight, CircleCheck, Info, MapPin, Plus, TriangleAlert, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { sesionActual } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { soles } from "@/compartido/dinero";
import { fechaLarga, horaCorta, primerNombre, saludo } from "@/compartido/fechas";
import { bandejaDeCobros } from "@/modulos/aportes/aplicacion/inicio";
import { consultarTablero, opcionesDelTablero } from "@/modulos/aportes/aplicacion/tablero";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { quejasPorAtender } from "@/modulos/incidencias/aplicacion/quejas";
import { Cuadre } from "./cobros/recaudacion/Cuadre";

export const metadata: Metadata = { title: "Resumen de la directiva" };

// DIR-INI-01. Las bandejas llegan con las HU de cada módulo; la recaudación del mes es de HU-COB-13.
export default async function ResumenDirectiva() {
  const sesion = await sesionActual();
  const ahora = new Date();
  const quejas = sesion && (await quejasPorAtender(sesion));
  const proxima = sesion ? await proximaAsamblea(sesion, ahora) : null;
  const recaudacion = sesion && (await consultarTablero(sesion, {}, ahora));
  const cobros = sesion && (await bandejaDeCobros(sesion));
  const mes = opcionesDelTablero(undefined, ahora).periodo.etiqueta;
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-titulo-1">
        {saludo(ahora)}, {primerNombre(sesion?.nombreCompleto ?? "")}
      </h1>
      <p className="text-texto-secundario">{fechaLarga(ahora)} · Resumen de la directiva</p>
      {sesion && (
        <div className="pt-4">
          <CambiarDePerfil sesion={sesion} actual="directiva" estilo="boton" />
        </div>
      )}
      {(quejas || cobros) && (
        <section aria-labelledby="titulo-para-atender" className="flex flex-col gap-4 pt-4">
          <h2 id="titulo-para-atender" className="text-titulo-2">
            Para atender
          </h2>
          {cobros && (
            <Link
              href="/directiva/cobros"
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
            >
              <span className="flex items-center gap-2 font-bold">
                <Wallet aria-hidden className="size-icono text-accion-primaria" />
                Cobros por atender
              </span>
              <span className="text-dato font-bold">{cobros.total}</span>
              {[
                [cobros.comprobantes, "comprobantes por revisar", "comprobante por revisar"],
                [cobros.cobrosEnCasa, "cobros en casa", "cobro en casa"],
                [cobros.reclamos, "reclamos de cuota", "reclamo de cuota"],
                [cobros.recibosEnPapel, "recibos en papel por entregar", "recibo en papel por entregar"],
              ]
                .filter(([n]) => Number(n) > 0)
                .map(([n, plural, singular]) => (
                  <span key={String(plural)}>
                    {n} {n === 1 ? singular : plural}
                  </span>
                ))}
              <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
                <Info aria-hidden className="size-icono-pequeno" />
                {cobros.total === 0
                  ? "Nada pendiente"
                  : cobros.total === 1
                    ? "1 pendiente"
                    : `${cobros.total} pendientes`}
              </span>
            </Link>
          )}
          {quejas && (
            <Link
              href="/directiva/incidentes?estado=porEvaluar"
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
            >
              <span className="flex items-center gap-2 font-bold">
                <MapPin aria-hidden className="size-icono text-accion-primaria" />
                Incidentes por evaluar
              </span>
              <span className="text-dato font-bold">{quejas.porEvaluar}</span>
              <span>{quejas.enRevision} en revisión</span>
              <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
                <Info aria-hidden className="size-icono-pequeno" />
                {quejas.porEvaluar === 0
                  ? "Nada pendiente"
                  : quejas.porEvaluar === 1
                    ? "1 reporte nuevo"
                    : `${quejas.porEvaluar} reportes nuevos`}
              </span>
            </Link>
          )}
          <Link
            href="/directiva/alertas"
            className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
          >
            <Bell aria-hidden className="size-icono" />
            Ver todas las alertas de la directiva
            <ChevronRight aria-hidden className="size-icono" />
          </Link>
        </section>
      )}
      {recaudacion && (
        <section aria-labelledby="titulo-recaudacion" className="flex flex-col gap-4 pt-4">
          <h2 id="titulo-recaudacion" className="text-titulo-2">
            Recaudación
          </h2>
          <p className="text-texto-secundario">{mes}</p>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ["Se cobró", soles(recaudacion.seCobro), `${recaudacion.recibos} recibos`],
              [
                "Falta cobrar",
                soles(recaudacion.faltaCobrar.monto),
                `${recaudacion.faltaCobrar.cuotas} cuotas semanales`,
              ],
            ].map(([titulo, valor, detalle]) => (
              <div
                key={titulo}
                className="flex flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <dt className="text-pequeno text-texto-secundario">{titulo}</dt>
                <dd className="text-titulo-2 font-bold">{valor}</dd>
                <dd className="text-pequeno text-texto-secundario">{detalle}</dd>
              </div>
            ))}
          </dl>
          <Cuadre t={recaudacion} />
          <div className="flex flex-col gap-2">
            <h3 className="text-titulo-3">Estado de las casas</h3>
            <p className="text-texto-secundario">{recaudacion.casas.total} casas</p>
            <ul className="flex flex-col gap-2">
              <li className="flex items-center gap-2">
                <CircleCheck aria-hidden className="size-icono-pequeno text-texto-exito" />
                <span className="font-bold">Al día:</span> {recaudacion.casas.alDia} casas
              </li>
              <li className="flex items-center gap-2">
                <TriangleAlert aria-hidden className="size-icono-pequeno text-texto-aviso" />
                <span className="font-bold">Atraso de 1 a 7 semanas:</span> {recaudacion.casas.atraso} casas
              </li>
              <li className="flex items-center gap-2">
                <TriangleAlert aria-hidden className="size-icono-pequeno text-texto-error" />
                <span className="font-bold">8 semanas o más:</span> {recaudacion.casas.critico} casas
              </li>
            </ul>
          </div>
          <BotonEnlace href="/directiva/cobros/recaudacion" variante="secundario" icono={ChevronRight}>
            Ver la recaudación completa
          </BotonEnlace>
        </section>
      )}
      <section aria-labelledby="titulo-proxima-asamblea" className="flex flex-col gap-4 pt-4">
        <h2 id="titulo-proxima-asamblea" className="text-titulo-2">
          Próxima asamblea
        </h2>
        {proxima ? (
          <Link
            href="/directiva/asambleas"
            className="flex flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
          >
            <span className="font-bold">{proxima.titulo}</span>
            <span>{fechaLarga(new Date(proxima.fechaHora))}</span>
            <span className="text-texto-secundario">
              {horaCorta(new Date(proxima.fechaHora))} · {proxima.lugar}
            </span>
            <span className="pt-1">
              Quórum proyectado: {proxima.confirmados.total} de {proxima.padronTotal} casas
            </span>
          </Link>
        ) : (
          <p>No hay ninguna asamblea convocada.</p>
        )}
      </section>
      <section aria-labelledby="titulo-crear" className="flex flex-col gap-2 pt-4">
        <h2 id="titulo-crear" className="text-titulo-2">
          Crear o registrar
        </h2>
        <p className="text-texto-secundario">Asambleas, comunicados, actas y balances de la junta.</p>
        <div className="flex flex-col items-start gap-separacion pt-2">
          <BotonEnlace href="/directiva/crear" variante="secundario" icono={Plus}>
            Crear o registrar
          </BotonEnlace>
        </div>
      </section>
    </div>
  );
}
