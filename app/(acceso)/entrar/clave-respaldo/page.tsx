import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sesionActual } from "@/app/_sesion/sesion";
import { datosParaClave } from "@/modulos/identidad/aplicacion/primerIngreso";
import { FormularioClave } from "./_componentes/FormularioClave";

export const metadata: Metadata = { title: "Clave de respaldo" };

// VEC-ACC-03 Clave de respaldo opcional (HU-GAR-02 CA3).
export default async function ClaveRespaldo() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/entrar");
  const { dni } = await datosParaClave(sesion);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso opcional</p>
        <h1 className="text-titulo-1">¿Quiere crear una clave de respaldo?</h1>
        <p>
          No es obligatorio. Le sirve si algún día no tiene WhatsApp a la mano. Normalmente entrará sin clave.
        </p>
      </div>
      <FormularioClave dni={dni} />
    </div>
  );
}
