import { Send } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { inicioSegunRoles, sesionActual } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { FormularioEntradaClave } from "../_componentes/FormularioEntradaClave";
import { Volver } from "../_componentes/Opciones";

export const metadata: Metadata = { title: "Entrar con mi clave" };

// VEC-ACC-05 Entrar con la clave de respaldo y VEC-ACC-06 la pausa tras cinco fallos (HU-GAR-24).
export default async function EntrarConClave() {
  const sesion = await sesionActual();
  if (sesion) redirect(inicioSegunRoles(sesion.roles));
  return (
    <div className="flex flex-col gap-6">
      <Volver href="/entrar">Volver a la entrada</Volver>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Entrar con mi clave</h1>
        <p>
          Use esta opción si no tiene su WhatsApp a la mano. Puede pegar la clave o usar la que guardó su
          teléfono.
        </p>
      </div>
      <FormularioEntradaClave
        etiquetaClave="Su clave"
        ayudaClave="Es la clave de respaldo que creó al entrar por primera vez."
        siguePausa={
          <>
            <p>
              Mientras tanto, puede entrar con un enlace nuevo por WhatsApp. Es más fácil: no necesita
              recordar nada.
            </p>
            <BotonEnlace href="/entrar/enlace-nuevo" icono={Send} variante="secundario">
              Recibir un enlace por WhatsApp
            </BotonEnlace>
          </>
        }
      />
      <Link
        href="/clave/nueva"
        className="inline-flex min-h-tactil items-center self-start font-bold text-texto-enlace"
      >
        Olvidé mi clave: crear una nueva
      </Link>
    </div>
  );
}
