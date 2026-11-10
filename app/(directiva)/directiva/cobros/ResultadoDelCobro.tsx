"use client";
// @HU-COB-11

import { Receipt, Wallet } from "lucide-react";
import type { RefObject } from "react";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { soles } from "@/compartido/dinero";
import { CobrosGuardados } from "./CobrosGuardados";
import type { CobroGuardado } from "./colaLocal";

/** Lo que pasó con un cobro en efectivo recién guardado: registrado, con problema o esperando señal. Lo usan «Cobrar en
 * casa» y «Cobrar en efectivo» (DIR-19). */
export function ResultadoDelCobro({
  nombre,
  resultado,
  titulo,
}: {
  nombre: string;
  resultado: CobroGuardado | null;
  titulo: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="flex flex-col gap-6">
      {resultado?.estado === "sincronizado" && (
        <>
          <MensajeEstado tipo="exito" titulo="Cobro registrado">
            <p>
              {resultado.alDia
                ? `${nombre} queda al día.`
                : `${nombre} todavía debe ${soles(resultado.debeAhora ?? 0)}.`}{" "}
              Emitimos el recibo N.° {resultado.reciboNumero} y se lo enviamos a su app
              {resultado.reciboEnPapel ? ". Queda uno en papel por entregar" : ""}.
            </p>
          </MensajeEstado>
          {resultado.excedente ? (
            <MensajeEstado tipo="aviso" titulo={`Sobraron ${soles(resultado.excedente)}`}>
              <p>
                La casa ya no debía tanto como pensaba. Consulte con la tesorera qué hacer con la diferencia.
              </p>
            </MensajeEstado>
          ) : null}
          <div className="flex flex-col gap-opuestas">
            {resultado.reciboId && (
              <BotonEnlace href={`/directiva/cobros/recibos/${resultado.reciboId}`} icono={Receipt}>
                Ver el recibo
              </BotonEnlace>
            )}
            <BotonEnlace href="/directiva/cobros" variante="secundario" icono={Wallet}>
              Volver a Cobros
            </BotonEnlace>
          </div>
        </>
      )}
      {resultado?.estado === "con_problema" && (
        <>
          <MensajeEstado tipo="error" titulo="No se pudo registrar el cobro">
            <p>{resultado.mensaje}</p>
          </MensajeEstado>
          <p>El cobro quedó guardado en su teléfono: véalo en «Cobros en efectivo guardados».</p>
          <BotonEnlace href="/directiva/cobros/guardados" icono={Wallet}>
            Cobros en efectivo guardados
          </BotonEnlace>
        </>
      )}
      {resultado?.estado !== "sincronizado" && resultado?.estado !== "con_problema" && (
        <>
          <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
            Cobros en efectivo guardados
          </h1>
          <CobrosGuardados recienGuardado />
          <BotonEnlace href="/directiva/cobros" variante="secundario" icono={Wallet}>
            Volver a cobros
          </BotonEnlace>
        </>
      )}
    </div>
  );
}
