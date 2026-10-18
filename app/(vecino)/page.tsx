import {
  Bell,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  DoorOpen,
  HandHeart,
  Info,
  MapPin,
  Newspaper,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CambiarDePerfil } from "@/app/_sesion/CambiarDePerfil";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaLarga, horaCorta, primerNombre } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { bloqueDeInicio } from "@/modulos/asambleas/aplicacion/inicio";
import { bloqueDeIdentidad } from "@/modulos/identidad/aplicacion/panelInicio";
import { visitaEnLaPuerta } from "@/modulos/identidad/aplicacion/garita";
import { bloqueDeReportes } from "@/modulos/incidencias/aplicacion/quejas";
import { ultimasNoticias } from "@/modulos/transparencia/aplicacion/comunicados";

export const metadata: Metadata = { title: "Inicio" };

/** Un bloque del inicio: toda la tarjeta es un enlace a su sección (HU-GAR-19 CA2). */
function Bloque({
  href,
  icono,
  titulo,
  children,
}: {
  href: string;
  icono: ReactNode;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-tactil items-center gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 text-texto-principal no-underline shadow-tarjeta hover:border-borde-fuerte"
    >
      {icono}
      <span className="flex flex-1 flex-col gap-1">
        <strong className="text-titulo-3 text-texto-enlace underline underline-offset-4">{titulo}</strong>
        {children}
      </span>
      <ChevronRight aria-hidden className="size-icono shrink-0" />
    </Link>
  );
}

const ICONO = "size-icono shrink-0 text-accion-primaria";

// VEC-ACC-09 Inicio del vecino (HU-GAR-19). El panel se compone aquí (modulos/identidad/CLAUDE.md), en el
// orden del prototipo: lo que espera respuesta, la cuota (M5), la asamblea (M4), Mis reportes, Mis avisos y,
// al final, lo que se puede dejar detrás de "Ver más" (R-11): actividad (M4) y noticias. Se lee en cada carga (CA3).
export default async function Inicio() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const [{ avisosSinLeer }, [noticia], reportes, enLaPuerta, { asamblea, actividad }] = await Promise.all([
    bloqueDeIdentidad(sesion),
    ultimasNoticias(sesion, 1),
    bloqueDeReportes(sesion),
    visitaEnLaPuerta(sesion),
    bloqueDeInicio(sesion),
  ]);
  const ahora = new Date();
  const bloques: ReactNode[] = [];
  if (asamblea) {
    const cuando = new Date(asamblea.fechaHora);
    bloques.push(
      <Bloque
        key="asamblea"
        href="/asambleas"
        icono={<CalendarDays aria-hidden className={ICONO} />}
        titulo="Próxima asamblea"
      >
        <span>{fechaLarga(cuando)}</span>
        <span className="text-texto-secundario">
          {horaCorta(cuando)} · {asamblea.lugar}
        </span>
        {asamblea.estado === "INFORMATIVA" ? (
          <span className="font-bold">Será una sesión informativa</span>
        ) : asamblea.confirmo ? (
          <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-exito bg-fondo-exito px-3 text-pequeno font-bold text-texto-exito">
            <CircleCheck aria-hidden className="size-icono-pequeno" />
            Usted asistirá
          </span>
        ) : (
          <span className="font-bold text-texto-enlace">Falta confirmar su asistencia</span>
        )}
      </Bloque>,
    );
  }
  bloques.push(
    <Bloque
      key="reportes"
      href="/incidentes"
      icono={<MapPin aria-hidden className={ICONO} />}
      titulo="Mis reportes"
    >
      {reportes.abiertos === 0 ? (
        <>
          <span>Ninguno abierto</span>
          <span className="text-texto-secundario">Si ve un problema en el barrio, puede reportarlo.</span>
          <span className="font-bold text-texto-enlace">Ver incidentes</span>
        </>
      ) : (
        <>
          <span>{reportes.abiertos === 1 ? "1 abierto" : `${reportes.abiertos} abiertos`}</span>
          {reportes.ultimo && (
            <>
              <span className="text-texto-secundario">
                N.° {reportes.ultimo.numero} · {reportes.ultimo.categoria}
              </span>
              <span className="inline-flex items-center gap-1 self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
                <Info aria-hidden className="size-icono-pequeno" />
                {reportes.ultimo.estado}
              </span>
            </>
          )}
        </>
      )}
    </Bloque>,
  );
  bloques.push(
    <Bloque key="avisos" href="/avisos" icono={<Bell aria-hidden className={ICONO} />} titulo="Mis avisos">
      {avisosSinLeer ? (
        <span className="inline-flex items-center gap-1 font-bold text-texto-info">
          <Info aria-hidden className="size-icono-pequeno" />
          {avisosSinLeer === 1 ? "1 nuevo" : `${avisosSinLeer} nuevos`}
        </span>
      ) : (
        <span className="text-texto-secundario">No tiene avisos nuevos</span>
      )}
    </Bloque>,
  );
  if (actividad)
    bloques.push(
      <Bloque
        key="actividad"
        href="/actividades"
        icono={<HandHeart aria-hidden className={ICONO} />}
        titulo="Actividad pro-fondos"
      >
        <span>{actividad.nombre}</span>
        <span className="text-texto-secundario">{fechaLarga(new Date(actividad.fechaHora))}</span>
      </Bloque>,
    );
  if (noticia)
    bloques.push(
      <Bloque
        key="noticias"
        href="/noticias"
        icono={<Newspaper aria-hidden className={ICONO} />}
        titulo="Noticias de la junta"
      >
        <span>{noticia.titulo}</span>
      </Bloque>,
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Hola, {primerNombre(sesion.nombreCompleto)}</h1>
        <p className="text-texto-secundario">{fechaLarga(ahora)}</p>
      </div>
      <CambiarDePerfil sesion={sesion} actual="vecino" estilo="boton" />
      {enLaPuerta && (
        <MensajeEstado tipo="aviso" titulo={`${enLaPuerta.nombre} está en la garita y pregunta por usted`}>
          <p>No estaba anunciado. {enLaPuerta.vigilante}, el vigilante, espera su respuesta.</p>
          <BotonEnlace href={`/visitas/${enLaPuerta.id}/responder`} icono={DoorOpen} variante="secundario">
            Responder
          </BotonEnlace>
        </MensajeEstado>
      )}
      <ListaVerMas etiqueta="Su resumen" elementos={bloques} normal={5} senior={3} />
    </div>
  );
}
