import { CircleCheck, Clock, Minus, Repeat, ShieldCheck, UserPlus, UserX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { GenerarEnlace } from "./GenerarEnlace";
import {
  listarEquipo,
  NOMBRE_ROL,
  PERMISOS,
  PERMISOS_POR_ROL,
  ROLES_EQUIPO,
} from "@/modulos/identidad/aplicacion/equipo";

export const metadata: Metadata = { title: "Cuentas del equipo" };

const ACCION =
  "inline-flex min-h-tactil items-center gap-2 rounded-control px-3 font-bold text-texto-enlace hover:bg-accion-secundaria-hover";

// ADM-EQU-01 Cuentas del equipo y permisos por rol (HU-GAR-21, 22 y 23).
export default async function Equipo({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; nombre?: string; rol?: string }>;
}) {
  const sesion = await exigirActor(["ADMINISTRADOR"], "/entrar/equipo");
  const miembros = await listarEquipo(sesion);
  const { aviso, nombre, rol } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Cuentas del equipo</h1>
        <p>Cada persona entra con su propio acceso de equipo, distinto del enlace de los vecinos.</p>
      </div>
      {aviso === "rol" && nombre && rol && (
        <MensajeEstado tipo="exito" titulo="Rol cambiado">
          <p>
            {nombre} ahora es {rol}. Sus permisos ya se actualizaron.
          </p>
        </MensajeEstado>
      )}
      {aviso === "quitado" && nombre && (
        <MensajeEstado tipo="exito" titulo={`Quitamos el acceso a ${nombre}`}>
          <p>Cerramos su sesión en todos sus equipos.</p>
        </MensajeEstado>
      )}
      <BotonEnlace href="/administracion/equipo/agregar" icono={UserPlus}>
        Agregar a una persona
      </BotonEnlace>

      <ul className="flex flex-col gap-separacion" aria-label="Personas del equipo">
        {miembros.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta"
          >
            <strong className="text-titulo-3">{m.nombre}</strong>
            <span>
              {m.rolTexto} · {m.vivienda ? `Vive en ${m.vivienda}` : "Personal externo"}
            </span>
            {m.tieneAcceso ? (
              <span className="inline-flex items-center gap-2 text-texto-exito">
                <CircleCheck aria-hidden className="size-icono-pequeno" />
                {m.ultimoAcceso
                  ? `Entró por última vez el ${fechaYHora(new Date(m.ultimoAcceso))}`
                  : "Con acceso; todavía no entra"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-texto-aviso">
                <Clock aria-hidden className="size-icono-pequeno" />
                Invitación enviada: todavía no crea su acceso
              </span>
            )}
            {m.gestionable && !m.tieneAcceso && <GenerarEnlace usuarioId={m.id} nombre={m.nombre} />}
            {m.esUsted && <span className="font-bold text-texto-secundario">Es usted</span>}
            {m.gestionable && (
              <div className="flex flex-wrap gap-separacion">
                <Link href={`/administracion/equipo/${m.id}/rol`} className={ACCION}>
                  <Repeat aria-hidden className="size-icono" />
                  Cambiar rol<span className="sr-only"> de {m.nombre}</span>
                </Link>
                <Link href={`/administracion/equipo/${m.id}/quitar`} className={ACCION}>
                  <UserX aria-hidden className="size-icono" />
                  Quitar acceso<span className="sr-only"> de {m.nombre}</span>
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>

      <Tarjeta titulo="Qué puede hacer cada rol">
        {/* En el teléfono la tabla se desplaza de lado: la región recibe el foco para moverla con el teclado. */}
        <div className="overflow-x-auto" role="region" aria-label="Permisos por rol" tabIndex={0}>
          <table className="w-full border-collapse text-left">
            <caption className="mb-3 text-left text-texto-secundario">
              Sí: el rol lo puede hacer. No: no lo puede hacer.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="border-b border-borde-sutil p-2">
                  Permiso
                </th>
                {ROLES_EQUIPO.map((rol) => (
                  <th key={rol} scope="col" className="border-b border-borde-sutil p-2">
                    {NOMBRE_ROL[rol]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISOS.map((permiso) => (
                <tr key={permiso}>
                  <th scope="row" className="border-b border-borde-sutil p-2 font-regular">
                    {permiso}
                  </th>
                  {ROLES_EQUIPO.map((rol) => {
                    const si = PERMISOS_POR_ROL[rol].includes(permiso);
                    const Icono = si ? CircleCheck : Minus;
                    return (
                      <td key={rol} className="border-b border-borde-sutil p-2">
                        <span
                          className={`inline-flex items-center gap-1 ${si ? "text-texto-exito" : "text-texto-secundario"}`}
                        >
                          <Icono aria-hidden className="size-icono-pequeno" />
                          {si ? "Sí" : "No"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
      <p className="inline-flex items-center gap-2 text-texto-secundario">
        <ShieldCheck aria-hidden className="size-icono-pequeno" />
        La administración puede todo esto y además gestiona el padrón, el equipo y la privacidad.
      </p>
    </div>
  );
}
