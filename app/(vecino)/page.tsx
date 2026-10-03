import { Bell, ChevronRight, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaLarga, saludo } from "@/compartido/fechas";
import { bloqueDeIdentidad } from "@/modulos/identidad/aplicacion/panelInicio";
import { ultimasNoticias } from "@/modulos/transparencia/aplicacion/comunicados";
import { TarjetaNoticia } from "./noticias/TarjetaNoticia";

export const metadata: Metadata = { title: "Inicio" };

// VEC-ACC-09 Inicio del vecino (HU-GAR-19). El panel se compone aquí (modulos/identidad/CLAUDE.md):
// M1 aporta el saludo, la vivienda y los avisos; M3, M4 y M5 suman la cuota, la asamblea y los
// reportes, cada bloque con su enlace (CA2). Se lee en cada carga (CA3).
export default async function Inicio() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const { nombre, vivienda, avisosSinLeer } = await bloqueDeIdentidad(sesion);
  const noticias = await ultimasNoticias(sesion, 2);
  const ahora = new Date();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">
          {saludo(ahora)}, {nombre}
        </h1>
        <p className="text-texto-secundario">
          {fechaLarga(ahora)}
          {vivienda && ` · ${vivienda}`}
        </p>
      </div>
      <Link
        href="/avisos"
        className="flex min-h-tactil items-center gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte"
      >
        <Bell aria-hidden className="size-icono shrink-0 text-accion-primaria" />
        <span className="flex flex-1 flex-col gap-1">
          <strong className="text-titulo-3 text-texto-enlace underline underline-offset-4">Mis avisos</strong>
          {avisosSinLeer ? (
            <span className="inline-flex items-center gap-1 font-bold text-texto-info">
              <Info aria-hidden className="size-icono-pequeno" />
              {avisosSinLeer === 1 ? "1 nuevo" : `${avisosSinLeer} nuevos`}
            </span>
          ) : (
            <span className="text-texto-secundario">No tiene avisos nuevos</span>
          )}
        </span>
        <ChevronRight aria-hidden className="size-icono shrink-0" />
      </Link>
      {noticias.length > 0 && (
        <section aria-labelledby="titulo-noticias" className="flex flex-col gap-separacion">
          <h2 id="titulo-noticias" className="text-titulo-2">
            Últimas noticias de la junta
          </h2>
          {noticias.map((n) => (
            <TarjetaNoticia key={n.id} noticia={n} nivel={3} />
          ))}
          <Link
            href="/noticias"
            className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace underline underline-offset-4"
          >
            Ver todas las noticias
            <ChevronRight aria-hidden className="size-icono" />
          </Link>
        </section>
      )}
    </div>
  );
}
