"use client";
// @HU-COB-11

import { CircleCheck, CloudOff, RefreshCw, TriangleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Boton } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { soles } from "@/compartido/dinero";
import { fechaYHora } from "@/compartido/fechas";
import { type CobroGuardado, listarCobros, sincronizarCobros } from "./colaLocal";
import { useConSenal } from "./useConSenal";

// DIR-COB-10: los cobros en efectivo de este teléfono, con su estado: «Pendiente de enviar» (nube tachada) frente a
// «Enviado». Sin señal dice que lo pendiente sigue guardado; al volver la señal se envía solo, y «Enviar ahora»
// no pide nada más. El estado no depende solo del color: lleva ícono y palabra (WCAG 1.4.1).
export function CobrosGuardados({ recienGuardado = false }: { recienGuardado?: boolean }) {
  const [cobros, setCobros] = useState<CobroGuardado[] | null>(null);
  const conSenal = useConSenal();
  const [sincronizando, setSincronizando] = useState(false);

  const leer = useCallback(() => listarCobros().then(setCobros), []);

  const sincronizar = useCallback(async () => {
    setSincronizando(true);
    await sincronizarCobros().catch(() => undefined);
    await leer();
    setSincronizando(false);
  }, [leer]);

  useEffect(() => {
    const alVolver = () => void sincronizar();
    window.addEventListener("online", alVolver);
    void leer();
    return () => window.removeEventListener("online", alVolver);
  }, [leer, sincronizar]);

  const pendientes = (cobros ?? []).filter((c) => c.estado === "pendiente").length;
  return (
    <div className="flex flex-col gap-6">
      {recienGuardado && (
        <MensajeEstado tipo="exito" titulo="Cobro guardado en su teléfono">
          <p>
            Queda pendiente de enviar. Se enviará solo cuando vuelva la señal y entonces se generará el recibo
            oficial.
          </p>
        </MensajeEstado>
      )}
      <p>
        Así distingue lo que ya llegó a la junta (Enviado) de lo que sigue en su teléfono (Pendiente de
        enviar).
      </p>
      {!conSenal && (
        <MensajeEstado tipo="aviso" titulo="Sin señal de internet">
          <p>Lo pendiente sigue guardado en este teléfono. Se enviará solo cuando vuelva la señal.</p>
        </MensajeEstado>
      )}
      {cobros === null ? (
        <p role="status">Cargando…</p>
      ) : cobros.length === 0 ? (
        <p role="status">No hay cobros guardados en este teléfono.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {cobros.map((c) => (
            <li
              key={c.idOperacionLocal}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
            >
              <h2 className="text-titulo-3">{c.nombre}</h2>
              <p>
                {c.vivienda} · {soles(c.monto)}
              </p>
              <p className="text-pequeno text-texto-secundario">{fechaYHora(new Date(c.registradoEn))}</p>
              {c.estado === "pendiente" && (
                <>
                  <p>El recibo oficial se genera al enviarlo.</p>
                  <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-aviso bg-fondo-aviso px-3 text-pequeno font-bold text-texto-aviso">
                    <CloudOff aria-hidden className="size-icono-pequeno" />
                    Pendiente de enviar
                  </span>
                </>
              )}
              {c.estado === "sincronizado" && (
                <>
                  <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-exito bg-fondo-exito px-3 text-pequeno font-bold text-texto-exito">
                    <CircleCheck aria-hidden className="size-icono-pequeno" />
                    Enviado
                  </span>
                  {c.excedente ? (
                    <p className="font-bold">
                      Sobraron {soles(c.excedente)}: la casa ya no debía tanto. Consulte con la tesorera.
                    </p>
                  ) : null}
                  {c.reciboId && (
                    <Link
                      href={`/directiva/cobros/recibos/${c.reciboId}`}
                      className="inline-flex min-h-tactil items-center font-bold text-texto-enlace underline underline-offset-4"
                    >
                      Ver el recibo N.° {c.reciboNumero}
                    </Link>
                  )}
                </>
              )}
              {c.estado === "con_problema" && (
                <>
                  <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-error bg-fondo-error px-3 text-pequeno font-bold text-texto-error">
                    <TriangleAlert aria-hidden className="size-icono-pequeno" />
                    No se pudo registrar
                  </span>
                  <p>{c.mensaje}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {pendientes > 0 && (
        <Boton
          type="button"
          icono={conSenal ? RefreshCw : WifiOff}
          anchoCompleto
          cargando={sincronizando}
          onClick={sincronizar}
        >
          Enviar ahora
        </Boton>
      )}
    </div>
  );
}
