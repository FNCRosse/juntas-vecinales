import { ChevronLeft, Pencil, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { InterruptorLetraGrande } from "@/componentes/a11y/InterruptorLetraGrande";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import { miPerfil } from "@/modulos/identidad/aplicacion/arco";
import { DescargarCopia } from "./DescargarCopia";
import { OposicionUbicacion } from "./OposicionUbicacion";

export const metadata: Metadata = { title: "Mi perfil y privacidad" };

function Dato({ termino, children }: { termino: string; children: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-pequeno text-texto-secundario">{termino}</dt>
      <dd className="font-bold">{children}</dd>
    </div>
  );
}

// VEC-ACC-13 Mi perfil y privacidad: sus datos, la letra grande, la oposición a mostrar su ubicación
// exacta (HU-GAR-15), la copia de sus datos (HU-GAR-12), pedir la cancelación (HU-GAR-14) y el estado
// de sus solicitudes (HU-GAR-13 CA2).
export default async function MiPerfil({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const [perfil, senior, { aviso }] = await Promise.all([
    miPerfil(sesion),
    modoSeniorAlRenderizar(),
    searchParams,
  ]);
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/mas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Más opciones
      </Link>
      <h1 className="text-titulo-1">Mi perfil y privacidad</h1>
      {aviso === "cancelacion" && (
        <MensajeEstado tipo="info" titulo="Recibimos su pedido de cancelación">
          <p>
            El administrador lo revisará dentro del plazo de ley y le avisará. Su cuenta sigue activa mientras
            tanto.
          </p>
        </MensajeEstado>
      )}
      {aviso === "correccion" && (
        <MensajeEstado tipo="exito" titulo="Solicitud enviada">
          <p>
            Puede ver cómo va en «Mis solicitudes», más abajo. Le avisaremos cuando la administración la
            resuelva.
          </p>
        </MensajeEstado>
      )}

      <Tarjeta titulo="Mis datos">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Dato termino="Nombre">{perfil.nombre}</Dato>
          <Dato termino="DNI">{perfil.dni}</Dato>
          <Dato termino="Vivienda">{perfil.vivienda}</Dato>
          <Dato termino="WhatsApp">{perfil.whatsapp}</Dato>
        </dl>
        <Link
          href="/mas/perfil/corregir"
          className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
        >
          <Pencil aria-hidden className="size-icono" />
          Corregir un dato o cambiar mi número
        </Link>
      </Tarjeta>

      <Tarjeta titulo="En este teléfono">
        <p>Su cuenta queda abierta. No tiene que volver a entrar.</p>
        <InterruptorLetraGrande activoAlInicio={senior} />
      </Tarjeta>

      <Tarjeta titulo="Mi privacidad">
        <OposicionUbicacion activaAlInicio={perfil.ocultaUbicacion} />
        <p>
          Puede bajar un archivo con todos los datos que la junta tiene de usted. No incluye datos de otros
          vecinos.
        </p>
        <DescargarCopia />
        {perfil.cancelacionPendiente ? (
          <MensajeEstado tipo="info" titulo="Pidió cancelar su cuenta">
            <p>
              La administración lo revisará dentro del plazo de ley y le avisará. Su cuenta sigue igual
              mientras tanto.
            </p>
          </MensajeEstado>
        ) : (
          <Link
            href="/mas/perfil/cancelar"
            className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
          >
            <TriangleAlert aria-hidden className="size-icono" />
            Pedir que cancelen mi cuenta
          </Link>
        )}
      </Tarjeta>

      {perfil.solicitudes.length > 0 && (
        <Tarjeta titulo="Mis solicitudes">
          <ul className="flex flex-col gap-3">
            {perfil.solicitudes.map((s) => (
              <li key={s.id} className="flex flex-col gap-1 border-b border-borde-sutil pb-3 last:border-b-0">
                <span className="text-pequeno text-texto-secundario">
                  N.° {s.numero} · {s.fecha}
                </span>
                <strong>{s.titulo}</strong>
                <span>{s.estadoTexto}</span>
                {s.motivo && <span className="text-texto-secundario">Motivo: {s.motivo}</span>}
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
    </div>
  );
}
