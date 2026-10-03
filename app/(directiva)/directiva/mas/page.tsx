import type { Metadata } from "next";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { exigirActor } from "@/app/_sesion/sesion";
import { TarjetaEnlace } from "@/componentes/a11y/Tarjeta";
import { solicitudesPorAtender } from "@/modulos/accesibilidad/aplicacion/mediacion";

export const metadata: Metadata = { title: "Más opciones" };

// Más opciones de la directiva (prototipo DMA01): pedidos de ayuda y "Cerrar sesión".
export default async function MasOpciones() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const pedidos = await solicitudesPorAtender({
    usuarioId: sesion.usuarioId,
    nombre: sesion.nombreCompleto,
    roles: sesion.roles,
  });
  const pendientes = pedidos.filter((p) => p.estado !== "ATENDIDA").length;
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-titulo-1">Más opciones</h1>
      <TarjetaEnlace href="/directiva/pedidos-de-ayuda" titulo="Pedidos de ayuda">
        <span>{pendientes ? `${pendientes} por atender` : "No hay pedidos por atender"}</span>
      </TarjetaEnlace>
      <CambiarDePerfil sesion={sesion} actual="directiva" estilo="tarjeta" />
      <BotonCerrarSesion destino="/entrar/equipo" />
    </div>
  );
}
