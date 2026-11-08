import { Bell, CircleCheck, Pencil, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { modoSeniorAlRenderizar } from "@/app/_accesibilidad/perfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { InterruptorLetraGrande } from "@/componentes/a11y/InterruptorLetraGrande";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { FilaEnlace, Tarjeta } from "@/componentes/a11y/Tarjeta";
import { miPerfil } from "@/modulos/identidad/aplicacion/arco";
import { DescargarCopia } from "./DescargarCopia";
import { OposicionUbicacion } from "./OposicionUbicacion";

export const metadata: Metadata = { title: "Mi perfil y privacidad" };

const ENLACE = "inline-flex min-h-tactil items-center gap-2 self-start font-bold";

/** Fila "Nombre ……… Carmen Huamán" del prototipo: el término a la izquierda y el dato en negrita. */
function Dato({ termino, children }: { termino: string; children: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-borde-sutil py-2 last:border-b-0">
      <dt className="text-texto-secundario">{termino}</dt>
      <dd className="font-bold">{children}</dd>
    </div>
  );
}

// VEC-ACC-13 Mi perfil y privacidad: sus datos, la vista grande, la oposición a mostrar su ubicación
// exacta (HU-GAR-15), la copia de sus datos (HU-GAR-12), qué avisos recibe, pedir la cancelación
// (HU-GAR-14) y el estado de sus solicitudes (HU-GAR-13 CA2).
export default async function MiPerfil({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const [perfil, senior, { aviso }] = await Promise.all([
    miPerfil(sesion),
    modoSeniorAlRenderizar(),
    searchParams,
  ]);
  return (
    <div className="flex flex-col gap-6">
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

      {/* Dos columnas independientes en escritorio (sin huecos entre tarjetas de distinto alto); en teléfono y tablet, una. */}
      <div data-ancho="completo" className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <Tarjeta titulo="Mis datos">
            <dl className="flex flex-col">
              <Dato termino="Nombre">{perfil.nombre}</Dato>
              <Dato termino="DNI">{perfil.dni}</Dato>
              <Dato termino="Vivienda">{perfil.vivienda}</Dato>
              <Dato termino="WhatsApp">{perfil.whatsapp}</Dato>
            </dl>
            <Link href="/mas/perfil/corregir" className={`${ENLACE} text-texto-enlace`}>
              <Pencil aria-hidden className="size-icono" />
              Corregir un dato o cambiar mi número
            </Link>
          </Tarjeta>

          <Tarjeta titulo="En este teléfono">
            <p className="flex gap-2">
              <CircleCheck aria-hidden className="size-icono shrink-0 text-texto-exito" />
              Su cuenta queda abierta. No tiene que volver a entrar.
            </p>
            <div className="flex">
              <InterruptorLetraGrande activoAlInicio={senior} />
            </div>
          </Tarjeta>
        </div>
        <div className="flex flex-col gap-6">
          <Tarjeta titulo="Mi privacidad">
            <OposicionUbicacion activaAlInicio={perfil.ocultaUbicacion} />
            <p className="text-texto-secundario">
              Puede bajar un archivo con todos los datos que la junta tiene de usted. No incluye datos de
              otros vecinos.
            </p>
            <DescargarCopia />
          </Tarjeta>

          <FilaEnlace href="/avisos/preferencias" icono={Bell} titulo="Qué avisos recibo" />
        </div>
      </div>

      {perfil.solicitudes.length > 0 && (
        <div data-ancho="completo">
          <Tarjeta titulo="Mis solicitudes">
            <ListaVerMas
              etiqueta="Mis solicitudes"
              elementos={perfil.solicitudes.map((s) => (
                <div key={s.id} className="flex flex-col gap-1 border-b border-borde-sutil pb-3">
                  <span className="text-pequeno text-texto-secundario">
                    N.° {s.numero} · {s.fecha}
                  </span>
                  <strong>{s.titulo}</strong>
                  <span>{s.estadoTexto}</span>
                  {s.motivo && <span className="text-texto-secundario">Motivo: {s.motivo}</span>}
                </div>
              ))}
            />
          </Tarjeta>
        </div>
      )}

      {perfil.cancelacionPendiente ? (
        <MensajeEstado tipo="info" titulo="Pidió cancelar su cuenta">
          <p>
            La administración lo revisará dentro del plazo de ley y le avisará. Su cuenta sigue igual mientras
            tanto.
          </p>
        </MensajeEstado>
      ) : (
        <section
          aria-labelledby="zona-peligro"
          data-ancho="completo"
          className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil p-4 senior:p-6"
        >
          <h2 id="zona-peligro" className="text-titulo-3">
            Si ya no vive en el barrio
          </h2>
          <Link href="/mas/perfil/cancelar" className={`${ENLACE} text-texto-error`}>
            <TriangleAlert aria-hidden className="size-icono" />
            Pedir que cancelen mi cuenta
          </Link>
        </section>
      )}
    </div>
  );
}
