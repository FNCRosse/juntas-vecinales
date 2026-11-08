import {
  Bell,
  CircleCheck,
  CirclePlus,
  ClipboardCheck,
  FileText,
  Info,
  Lightbulb,
  Megaphone,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import type { Metadata } from "next";
import { sesionActual } from "@/app/_sesion/sesion";
import { fechaEnFrase, fechaLarga, horaCorta } from "@/compartido/fechas";
import { BarraQuorum } from "@/componentes/a11y/BarraQuorum";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { EncabezadoPagina } from "@/componentes/a11y/EncabezadoPagina";
import { Insignia } from "@/componentes/a11y/Insignia";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { FilaEnlace, Tarjeta } from "@/componentes/a11y/Tarjeta";
import { casoSinQuorum } from "@/modulos/asambleas/aplicacion/contingencia";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { bandejaDePropuestas } from "@/modulos/asambleas/aplicacion/propuestas";

export const metadata: Metadata = { title: "Asambleas" };

// DIR-ASA-01 (HU-ASA-01, HU-ASA-04): la próxima asamblea con su quórum proyectado y, debajo, las tareas de la
// asamblea (prototipo DAS01). Convocar, cargar la asistencia, el pase de lista, las propuestas y el acta se abren desde
// su fila. Las actividades pro-fondos van aparte, en su propia sección.
export default async function AsambleasDirectiva() {
  const sesion = await sesionActual();
  const proxima = sesion ? await proximaAsamblea(sesion) : null;
  const sinQuorum = sesion ? await casoSinQuorum(sesion) : null;
  const porRevisar =
    sesion && proxima
      ? (await bandejaDePropuestas(sesion, proxima.id)).filter((p) => p.estado === "PENDIENTE_REVISION")
          .length
      : 0;
  const tareas = [
    {
      href: "/directiva/asambleas/asistencia",
      icono: UserCheck,
      titulo: "Registrar la asistencia de un vecino",
      detalle: "Como mediador",
    },
    {
      href: "/directiva/asambleas/propuestas",
      icono: Lightbulb,
      titulo: "Propuestas para la agenda",
      detalle: `${porRevisar} por revisar`,
    },
    {
      href: "/directiva/asambleas/pase-de-lista",
      icono: ClipboardCheck,
      titulo: "Hacer el pase de lista",
      detalle: "Quórum definitivo y votaciones",
    },
    {
      href: "/directiva/asambleas/nueva",
      icono: Megaphone,
      titulo: "Nueva convocatoria",
      detalle: "Convocar una asamblea, con afiche para imprimir",
    },
    {
      href: "/directiva/actas/nueva",
      icono: FileText,
      titulo: "Acta de la asamblea",
      detalle: "Acuerdos y PDF oficial",
    },
    {
      href: "/directiva/comunicados",
      icono: Bell,
      titulo: "Comunicados a la comunidad",
      detalle: "Ver, publicar y corregir avisos",
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPagina
        titulo="Asambleas"
        accion={
          <BotonEnlace href="/directiva/asambleas/nueva" icono={CirclePlus} anchoCompleto>
            Convocar una asamblea
          </BotonEnlace>
        }
      />
      {sinQuorum && (
        <MensajeEstado tipo="aviso" titulo="No se llegó al quórum">
          <p>
            Al corte confirmaron {sinQuorum.quorum.confirmados} de {sinQuorum.padronTotal} casas. El mínimo es{" "}
            {sinQuorum.quorumRequerido}. Decida si reprograma la asamblea o la convierte en una sesión
            informativa.
          </p>
          <BotonEnlace href="/directiva/asambleas/sin-quorum" icono={UsersRound}>
            Decidir qué hacer
          </BotonEnlace>
        </MensajeEstado>
      )}
      {proxima?.estado === "REPROGRAMADA" && (
        <MensajeEstado tipo="info" titulo="Asamblea reprogramada">
          <p>Avisamos a las {proxima.padronTotal} casas la nueva fecha.</p>
        </MensajeEstado>
      )}
      {proxima?.estado === "INFORMATIVA" && (
        <MensajeEstado tipo="aviso" icono={Info} titulo="Será una sesión informativa">
          <p>Avisamos a la comunidad que no se votará ni se tomarán acuerdos.</p>
        </MensajeEstado>
      )}
      {proxima ? (
        <div className="flex flex-col gap-6 md:grid md:grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] md:items-start">
          <section
            aria-labelledby="titulo-proxima"
            className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
          >
            <h2 id="titulo-proxima" className="text-pequeno font-bold text-texto-secundario">
              Próxima asamblea
            </h2>
            <strong className="text-titulo-2">{proxima.titulo}</strong>
            <span className="text-dato font-bold leading-titulo">
              {fechaLarga(new Date(proxima.fechaHora), { conAnio: false })}
            </span>
            <span>
              {horaCorta(new Date(proxima.fechaHora))} · {proxima.lugar}
            </span>
            <span className="text-pequeno text-texto-secundario">
              Confirmaciones hasta {fechaEnFrase(new Date(proxima.confirmacionesHasta))} a las{" "}
              {horaCorta(new Date(proxima.confirmacionesHasta))}
            </span>
          </section>
          <Tarjeta titulo="Quórum proyectado" icono={Users}>
            <span className="text-pequeno text-texto-secundario">
              Se actualiza cada vez que alguien confirma.
            </span>
            <span className="text-dato font-bold leading-titulo">
              {proxima.quorum.confirmados} de {proxima.padronTotal} casas
            </span>
            <span>{proxima.quorum.texto}</span>
            <BarraQuorum
              confirmados={proxima.quorum.confirmados}
              padronTotal={proxima.padronTotal}
              requerido={proxima.quorumRequerido}
              alcanza={proxima.quorum.alcanza}
            />
            <span className="text-pequeno text-texto-secundario">
              La línea marca el mínimo: {proxima.quorumRequerido} casas (la mitad del padrón más una).
            </span>
            <table className="w-full border-collapse">
              <caption className="pb-2 text-left text-texto-secundario">
                De dónde salen las confirmaciones
              </caption>
              <tbody>
                <tr>
                  <td className="border-b border-borde-sutil py-3 pr-2">Confirmaron en la app</td>
                  <td className="whitespace-nowrap border-b border-borde-sutil py-3 text-right">
                    {proxima.confirmados.digital}
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-borde-sutil py-3 pr-2">Registradas por un mediador</td>
                  <td className="whitespace-nowrap border-b border-borde-sutil py-3 text-right">
                    {proxima.confirmados.asistida}
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-3 text-left">
                    Total
                  </th>
                  <td className="py-3 text-right font-bold">{proxima.quorum.confirmados}</td>
                </tr>
              </tbody>
            </table>
            <Insignia
              tono={proxima.quorum.alcanza ? "exito" : "info"}
              icono={proxima.quorum.alcanza ? CircleCheck : Info}
            >
              {proxima.quorum.alcanza ? "Quórum proyectado suficiente" : "Todavía no alcanza el quórum"}
            </Insignia>
            <span className="text-pequeno text-texto-secundario">
              Al corte le avisaremos si alcanza. Si no, tendrá que decidir: reprogramar o hacer una sesión
              informativa.
            </span>
          </Tarjeta>
        </div>
      ) : (
        <p>No hay asambleas convocadas. Use «Nueva convocatoria» para crear la primera.</p>
      )}
      <section aria-labelledby="titulo-tareas" className="flex flex-col gap-3">
        <h2 id="titulo-tareas" className="text-titulo-3">
          Tareas de la asamblea
        </h2>
        <ListaVerMas
          etiqueta="Tareas de la asamblea"
          elementos={tareas.map((t) => (
            <FilaEnlace key={t.href} href={t.href} icono={t.icono} titulo={t.titulo} detalle={t.detalle} />
          ))}
        />
      </section>
    </div>
  );
}
