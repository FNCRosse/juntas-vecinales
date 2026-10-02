import type { Metadata } from "next";
import { Volver, OpcionEntrada } from "../../_componentes/Opciones";
import { FormularioPedirEnlace } from "../../_componentes/FormularioPedirEnlace";

export const metadata: Metadata = { title: "Pedir un enlace nuevo" };

// VEC-ACC-04 Pedir un enlace nuevo (HU-GAR-11).
export default function EnlaceNuevo() {
  return (
    <div className="flex flex-col gap-6">
      <Volver href="/entrar">Volver a la entrada</Volver>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Pedir un enlace nuevo</h1>
        <p>
          Le mandaremos un enlace nuevo al WhatsApp que registró en la junta. El enlace anterior dejará de
          funcionar.
        </p>
      </div>
      <FormularioPedirEnlace
        ruta="/api/auth/magic-link/reenviar"
        textoBoton="Enviar un enlace nuevo"
        textoEnviado="Revise su WhatsApp. El enlace anterior ya no sirve."
      />
      <OpcionEntrada
        href="/clave"
        icono="clave"
        titulo="No tengo WhatsApp: entrar con mi clave"
        detalle="Si ya creó una clave de respaldo"
      />
    </div>
  );
}
