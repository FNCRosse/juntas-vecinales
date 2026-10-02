import { CircleUser, EyeOff, FileText, type LucideIcon, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sesionActual } from "@/app/_sesion/sesion";
import { FormularioPolitica } from "./_componentes/FormularioPolitica";

export const metadata: Metadata = { title: "Cómo cuidamos sus datos" };

const PUNTOS: [LucideIcon, string, string][] = [
  [CircleUser, "Qué guardamos:", "su nombre, DNI, dirección, teléfono, sus pagos y los reportes que haga."],
  [ShieldCheck, "Para qué:", "calcular su cuota, avisarle de asambleas y atender sus reportes. Nada más."],
  [EyeOff, "Quién los ve:", "solo la directiva y el administrador. Sus vecinos no ven lo que usted debe."],
  [
    FileText,
    "Sus derechos:",
    "puede pedir una copia de sus datos, corregirlos, borrarlos o pedir que no se muestren. Lo hace desde Mi perfil.",
  ],
];

// VEC-ACC-02 Política de privacidad con aceptación expresa (HU-GAR-02 CA2), antes de empezar.
export default async function Privacidad() {
  const sesion = await sesionActual();
  if (!sesion) redirect("/entrar");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Antes de empezar</p>
        <h1 className="text-titulo-1">Cómo cuidamos sus datos</h1>
      </div>
      <ul className="flex flex-col gap-4">
        {PUNTOS.map(([Icono, titulo, texto]) => (
          <li key={titulo} className="flex items-start gap-3">
            <Icono aria-hidden className="size-icono shrink-0 text-accion-primaria" />
            <span>
              <strong>{titulo}</strong> {texto}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href="/privacidad"
        className="inline-flex min-h-tactil items-center self-start font-bold text-texto-enlace"
      >
        Leer la política de privacidad completa
      </Link>
      <FormularioPolitica />
    </div>
  );
}
