import { CircleUser, DoorOpen, FileText, HandHeart, LifeBuoy, Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { BotonCerrarSesion } from "@/app/_sesion/BotonCerrarSesion";
import { exigirActor } from "@/app/_sesion/sesion";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { FilaEnlace } from "@/componentes/a11y/Tarjeta";

export const metadata: Metadata = { title: "Más opciones" };

// VEC-ACC-16 Más opciones: lista plana con ícono; en vista grande se ven tres y "Ver más" (R-11). Noticias también está
// aquí (VEC-51). Lo demás se abre desde el inicio (Mis avisos, Mis reportes) o desde su pantalla: "Qué avisos recibo" desde Avisos, la guía rápida
// desde Ayuda y accesibilidad y las actas desde Cuentas del barrio. "Cerrar sesión" va aparte, abajo.
export default async function MasOpciones() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Más opciones</h1>
      <ListaVerMas
        etiqueta="Más opciones"
        normal={6}
        elementos={[
          <FilaEnlace key="noticias" href="/noticias" icono={Newspaper} titulo="Noticias de la junta" />,
          <FilaEnlace key="visitas" href="/visitas" icono={DoorOpen} titulo="Mis visitas" />,
          <FilaEnlace
            key="ayuda"
            href="/mas/ayuda-y-accesibilidad"
            icono={LifeBuoy}
            titulo="Ayuda y accesibilidad"
          />,
          <FilaEnlace
            key="actividades"
            href="/actividades"
            icono={HandHeart}
            titulo="Actividades pro-fondos"
          />,
          <FilaEnlace
            key="transparencia"
            href="/transparencia/cuentas"
            icono={FileText}
            titulo="Transparencia"
          />,
          <FilaEnlace key="perfil" href="/mas/perfil" icono={CircleUser} titulo="Mi perfil y privacidad" />,
        ]}
      />
      <CambiarDePerfil sesion={sesion} actual="vecino" estilo="tarjeta" />
      <div className="mt-12 flex flex-col">
        <BotonCerrarSesion destino="/entrar" />
      </div>
    </div>
  );
}
