import { ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BarraQuorum } from "@/componentes/a11y/BarraQuorum";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { fechaLarga, horaCorta } from "@/compartido/fechas";
import { paseDeLista } from "@/modulos/asambleas/aplicacion/checkin";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { AbrirVotaciones } from "./AbrirVotaciones";
import { MarcarPresentes } from "./MarcarPresentes";

export const metadata: Metadata = { title: "Pase de lista" };

// DIR-ASA-09 (HU-ASA-07): el pase de lista del día de la asamblea, con el quórum definitivo. Los poderes se
// validan en su propia pantalla (R-11).
export default async function PaseDeLista() {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const proxima = await proximaAsamblea(sesion);
  if (!proxima) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-titulo-1">Pase de lista</h1>
        <p>No hay ninguna asamblea convocada para hacer el pase de lista.</p>
        <BotonEnlace href="/directiva/asambleas" icono={ClipboardCheck}>
          Volver a asambleas
        </BotonEnlace>
      </div>
    );
  }

  const lista = await paseDeLista(sesion, proxima.id);
  const { quorum } = lista;
  const cuando = new Date(proxima.fechaHora);
  const porValidar = lista.poderes.filter((p) => !p.validado).length;
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/directiva/asambleas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a asambleas
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">
          {fechaLarga(cuando)} · {horaCorta(cuando)}
        </p>
        <h1 className="text-titulo-1">Pase de lista</h1>
        <p>
          Marque a quienes llegan y valide los poderes. El quórum se calcula solo con presentes y poderes
          validados aquí.
        </p>
      </div>

      <section aria-labelledby="titulo-quorum-definitivo" className="flex flex-col gap-3">
        <h2 id="titulo-quorum-definitivo" className="text-titulo-2">
          Quórum definitivo
        </h2>
        <p className="text-dato font-bold">
          {quorum.total} de {quorum.padronTotal} casas
        </p>
        <p className="text-texto-secundario">
          Presentes: {quorum.presentes} · Poderes validados: {quorum.poderes}
        </p>
        <BarraQuorum
          confirmados={quorum.total}
          padronTotal={quorum.padronTotal}
          requerido={quorum.requerido}
          alcanza={quorum.alcanza}
          texto={`La línea marca el mínimo: ${quorum.requerido} casas (la mitad del padrón más una).`}
          insignias={{ alcanza: "Hay quórum", noAlcanza: "Todavía no hay quórum" }}
        />
      </section>

      {lista.votaciones === "SIN_VOTACION" && (
        <MensajeEstado tipo="info" titulo="Sesión informativa">
          <p>No se registran votaciones ni acuerdos en esta reunión.</p>
        </MensajeEstado>
      )}
      {lista.votaciones === "ABIERTAS" && (
        <MensajeEstado tipo="exito" titulo="Votaciones abiertas">
          <p>Los vecinos presentes ya pueden votar. El resultado irá al acta.</p>
        </MensajeEstado>
      )}
      {lista.votaciones === "CERRADAS" && (
        <>
          {quorum.alcanza ? (
            <MensajeEstado tipo="exito" titulo="Hay quórum">
              <p>Ya puede abrir las votaciones.</p>
            </MensajeEstado>
          ) : (
            <MensajeEstado tipo="aviso" titulo="Votaciones bloqueadas">
              <p>
                {quorum.faltan === 1 ? "Falta 1 casa" : `Faltan ${quorum.faltan} casas`} para el quórum de{" "}
                {quorum.requerido}. Mientras tanto no se pueden registrar votos ni acuerdos.
              </p>
            </MensajeEstado>
          )}
          <AbrirVotaciones asambleaId={proxima.id} />
        </>
      )}

      <section aria-labelledby="titulo-llegando" className="flex flex-col gap-4">
        <h2 id="titulo-llegando" className="text-titulo-2">
          Van llegando
        </h2>
        <MarcarPresentes asambleaId={proxima.id} />
        {lista.llegaron.length > 0 && (
          <ListaVerMas
            etiqueta="Ya marcados presentes"
            normal={3}
            senior={1}
            elementos={lista.llegaron.map((l) => (
              <p key={l.predioId} className="flex flex-col">
                <span className="font-bold">{l.nombre}</span>
                <span className="text-texto-secundario">{l.vivienda} · Presente</span>
              </p>
            ))}
          />
        )}
      </section>

      <Link
        href="/directiva/asambleas/poderes"
        className="flex min-h-tactil items-center gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte senior:p-6"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <strong>Poderes (delegaciones de voto)</strong>
          <span className="text-texto-secundario">
            {lista.poderes.length === 0
              ? "No hay poderes registrados"
              : porValidar === 0
                ? "Todos los poderes están validados"
                : `${porValidar} por validar`}
          </span>
        </span>
        <ChevronRight aria-hidden className="size-icono-pequeno shrink-0" />
      </Link>
    </div>
  );
}
