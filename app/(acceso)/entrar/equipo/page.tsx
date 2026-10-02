import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { inicioSegunRoles, sesionActual } from "@/app/_sesion/sesion";
import { FormularioEntradaClave } from "../../_componentes/FormularioEntradaClave";

export const metadata: Metadata = { title: "Entrar como parte del equipo" };

// ADM-ENT-01 y VIG-ENT-01: la directiva, los mediadores, los vigilantes y la administración entran
// con DNI y clave. La opción "llave" del prototipo no se implementa (modulos/identidad/CLAUDE.md).
export default async function EntradaEquipo() {
  const sesion = await sesionActual();
  if (sesion) redirect(inicioSegunRoles(sesion.roles));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-pequeno font-bold text-texto-secundario">Equipo de la junta</span>
        <h1 className="text-titulo-1">Entrar como parte del equipo</h1>
        <p>
          Esta entrada es para la directiva, los mediadores, los vigilantes y la administración. Los vecinos
          entran con el enlace de WhatsApp.
        </p>
      </div>
      <FormularioEntradaClave
        etiquetaClave="Clave de equipo"
        ayudaClave="Puede pegarla o dejar que su gestor de contraseñas la complete."
        siguePausa={<p>Si no recuerda la clave, pida una nueva a la administración.</p>}
      />
      <p className="text-texto-secundario">
        ¿Olvidó su clave? Pida una nueva a la administración de la junta.
      </p>
    </div>
  );
}
