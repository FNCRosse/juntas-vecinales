import { MessageCircle } from "lucide-react";
import { contactoDeAdministracion } from "@/modulos/identidad/aplicacion/datosParaAyuda";

// "Pedir ayuda" del equipo (directiva, administración y garita): a quién recurrir con la plataforma.
export async function AyudaEquipo() {
  const contacto = await contactoDeAdministracion();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Pedir ayuda</h1>
      <p>Si algo de la plataforma no funciona o no sabe cómo seguir, escriba o llame a la administración.</p>
      {contacto && (
        <div className="flex items-start gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta">
          <MessageCircle aria-hidden className="size-icono shrink-0 text-accion-primaria" />
          <div className="flex flex-col">
            <strong>{contacto.nombre}</strong>
            {contacto.telefono && (
              <a
                href={`tel:+51${contacto.telefono.replace(/\s/g, "")}`}
                className="inline-flex min-h-tactil items-center font-bold text-texto-enlace"
              >
                Llamar al {contacto.telefono}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
