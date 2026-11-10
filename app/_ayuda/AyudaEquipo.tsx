import { type LucideIcon, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { contactoDeAdministracion, contactoDeTurno } from "@/modulos/identidad/aplicacion/datosParaAyuda";

type Contacto = { nombre: string; telefono: string | null };

/** Una persona a quien recurrir: se le llama o se le escribe con un toque, sin mostrar su número (ADM-06). */
function TarjetaContacto({
  titulo,
  detalle,
  contacto,
  Icono,
}: {
  titulo: string;
  detalle: string;
  contacto: Contacto;
  Icono: LucideIcon;
}) {
  const numero = contacto.telefono?.replace(/\s/g, "");
  return (
    <section
      aria-label={titulo}
      className="flex items-start gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta"
    >
      <Icono aria-hidden className="size-icono shrink-0 text-accion-primaria" />
      <div className="flex flex-col gap-1">
        <h2 className="text-titulo-3">{titulo}</h2>
        <p className="text-texto-secundario">{detalle}</p>
        <strong>{contacto.nombre}</strong>
        {numero ? (
          <div className="flex flex-col gap-separacion">
            <a
              href={`tel:+51${numero}`}
              className="inline-flex min-h-tactil items-center gap-2 font-bold text-texto-enlace"
            >
              <Phone aria-hidden className="size-icono" />
              Llamar a {contacto.nombre}
            </a>
            <a
              href={`https://wa.me/51${numero}`}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-tactil items-center gap-2 font-bold text-texto-enlace"
            >
              <MessageCircle aria-hidden className="size-icono" />
              Escribirle por WhatsApp
            </a>
          </div>
        ) : (
          <p>No tiene un teléfono registrado.</p>
        )}
      </div>
    </section>
  );
}

// "Pedir ayuda" del equipo (directiva, administración y garita): a quién recurrir y cómo, con un toque (DIR-52). La garita
// además tiene a la directiva de turno, para una emergencia en el barrio (VIG-18).
export async function AyudaEquipo({ conDirectivaDeTurno = false }: { conDirectivaDeTurno?: boolean }) {
  const [administracion, deTurno] = await Promise.all([
    contactoDeAdministracion(),
    conDirectivaDeTurno ? contactoDeTurno() : null,
  ]);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Pedir ayuda</h1>
      {deTurno && (
        <TarjetaContacto
          titulo="Directiva de turno"
          detalle="Para una emergencia o un problema en el barrio."
          contacto={deTurno}
          Icono={ShieldAlert}
        />
      )}
      {administracion && (
        <TarjetaContacto
          titulo="Administración"
          detalle="Si algo de la plataforma no funciona o no sabe cómo seguir."
          contacto={administracion}
          Icono={MessageCircle}
        />
      )}
    </div>
  );
}
