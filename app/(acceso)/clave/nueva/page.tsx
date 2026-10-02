import type { Metadata } from "next";
import { FormularioPedirEnlace } from "../../_componentes/FormularioPedirEnlace";
import { Volver } from "../../_componentes/Opciones";

export const metadata: Metadata = { title: "Crear una clave nueva" };

// VEC-ACC-07 Crear una clave nueva (HU-GAR-25 CA1 y CA2).
export default function ClaveNueva() {
  return (
    <div className="flex flex-col gap-6">
      <Volver href="/clave">Volver a entrar con clave</Volver>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Crear una clave nueva</h1>
        <p>
          Le mandaremos un enlace a su WhatsApp registrado. Al abrirlo, escribirá su clave nueva y la anterior
          dejará de servir.
        </p>
      </div>
      <FormularioPedirEnlace
        ruta="/api/auth/clave/restablecer"
        textoBoton="Enviarme el enlace"
        tituloEnviado="Revise su WhatsApp"
        textoEnviado="Le enviamos el enlace al WhatsApp terminado en {terminado}. Cuando cree su clave, le avisaremos del cambio."
      />
    </div>
  );
}
