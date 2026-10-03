import { TriangleAlert } from "lucide-react";
import { fechaYHora } from "@/compartido/fechas";
import { textoParaLeer } from "@/modulos/accesibilidad/aplicacion/sintesisVoz";
import type { NoticiaDto } from "@/modulos/transparencia/aplicacion/comunicados";
import { Escuchar } from "./Escuchar";

// Una noticia del feed (VEC-TRA-04): la urgencia lleva ícono y la palabra "Urgente", nunca solo color.
export function TarjetaNoticia({
  noticia,
  nivel = 2,
  conVoz = false,
}: {
  noticia: NoticiaDto;
  nivel?: 2 | 3;
  /** Con la lectura en voz alta activa en el perfil (HU-ACC-02 CA2): muestra el botón Escuchar. */
  conVoz?: boolean;
}) {
  const Titulo = nivel === 2 ? "h2" : "h3";
  return (
    <article className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta">
      <div className="flex flex-wrap items-center gap-3 text-pequeno">
        {noticia.urgencia === "URGENTE" && (
          <span className="inline-flex items-center gap-1 rounded-pastilla border border-borde-aviso bg-fondo-aviso px-3 font-bold text-texto-aviso">
            <TriangleAlert aria-hidden className="size-icono-pequeno" />
            Urgente
          </span>
        )}
        <span className="text-texto-secundario">{fechaYHora(new Date(noticia.fecha))}</span>
      </div>
      <Titulo className="text-titulo-3">{noticia.titulo}</Titulo>
      <p>{noticia.cuerpo}</p>
      <p className="text-pequeno text-texto-secundario">Publicó: {noticia.autor}</p>
      {conVoz && <Escuchar titulo={noticia.titulo} texto={textoParaLeer(noticia)} />}
    </article>
  );
}
