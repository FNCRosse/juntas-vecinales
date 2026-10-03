import type { Metadata } from "next";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { exigirActor } from "@/app/_sesion/sesion";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";
import { avisosSinLeer } from "@/modulos/identidad/aplicacion/avisos";

export const metadata: Metadata = { title: "Más opciones" };

// VEC-ACC-16 Más opciones.
export default async function MasOpciones() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const sinLeer = await avisosSinLeer(sesion);
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-titulo-1">Más opciones</h1>
      <div className="flex flex-col gap-separacion">
        <TarjetaEnlace href="/visitas" titulo="Mis visitas">
          <span>Anuncie a quien viene a su casa para que entre sin esperar.</span>
        </TarjetaEnlace>
        <TarjetaEnlace href="/noticias" titulo="Noticias de la junta">
          <span>Los comunicados de la directiva: cortes de servicio, seguridad y trámites.</span>
        </TarjetaEnlace>
        <TarjetaEnlace href="/transparencia" titulo="Actas y balances">
          <span>Lo que acordó la asamblea, con su PDF para descargar.</span>
        </TarjetaEnlace>
        <TarjetaEnlace href="/avisos" titulo="Avisos">
          <span>
            {sinLeer
              ? sinLeer === 1
                ? "1 aviso nuevo"
                : `${sinLeer} avisos nuevos`
              : "No tiene avisos nuevos"}
          </span>
        </TarjetaEnlace>
        <TarjetaEnlace href="/avisos/preferencias" titulo="Qué avisos recibo">
          <span>Elija qué avisos le llegan por WhatsApp.</span>
        </TarjetaEnlace>
        <TarjetaEnlace href="/mas/perfil" titulo="Mi perfil y privacidad">
          <span>Sus datos, corregir un dato y bajar una copia de lo que la junta tiene de usted.</span>
        </TarjetaEnlace>
        <TarjetaEnlace href="/mas/ayuda-y-accesibilidad" titulo="Ayuda y accesibilidad">
          <span>Letra grande y el estado de sus pedidos de ayuda.</span>
        </TarjetaEnlace>
        <TarjetaEnlace href="/guia" titulo="Guía rápida">
          <span>Tres pasos para conocer la plataforma y tenerla en su pantalla de inicio.</span>
        </TarjetaEnlace>
      </div>
      <BotonCerrarSesion destino="/entrar" />
    </div>
  );
}
