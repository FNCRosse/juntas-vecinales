import {
  Bell,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  DoorOpen,
  HandCoins,
  HandHeart,
  Info,
  MapPin,
  Megaphone,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { exigirActor } from "@/app/_sesion/sesion";
import { soles } from "@/compartido/dinero";
import { fechaLarga, horaCorta, primerNombre } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { Insignia } from "@/componentes/a11y/Insignia";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { FilaEnlace, Tarjeta, TarjetaPulsable } from "@/componentes/a11y/Tarjeta";
import { bloqueDeCuota } from "@/modulos/aportes/aplicacion/inicio";
import { bloqueDeInicio } from "@/modulos/asambleas/aplicacion/inicio";
import { bloqueDeIdentidad } from "@/modulos/identidad/aplicacion/panelInicio";
import { visitaEnLaPuerta } from "@/modulos/identidad/aplicacion/garita";
import { bloqueDeReportes } from "@/modulos/incidencias/aplicacion/quejas";
import { ultimasNoticias } from "@/modulos/transparencia/aplicacion/comunicados";

export const metadata: Metadata = { title: "Inicio" };

type Cuota = NonNullable<Awaited<ReturnType<typeof bloqueDeCuota>>>;

const ENLACE = "inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace";

/** C-05 Tarjeta · Mi cuota semanal: lo que debe, su estado y, si debe, "Pagar mi cuota" (HU-COB-02 CA1). */
function TarjetaCuota({ cuota }: { cuota: Cuota }) {
  const debe = cuota.estado === "PENDIENTE" || cuota.estado === "EN_REVISION";
  const semanas = cuota.semanas === 1 ? "1 semana" : `${cuota.semanas} semanas`;
  return (
    <Tarjeta
      destacada
      icono={Wallet}
      titulo={cuota.porSemana ? `Mi cuota semanal: ${soles(cuota.porSemana)}` : "Mi cuota semanal"}
    >
      {cuota.estado === "SIN_CUOTAS" && (
        <p className="text-texto-secundario">Todavía no se emitió su primera cuota.</p>
      )}
      {cuota.estado === "AL_DIA" && (
        <>
          <p className="text-dato font-bold leading-titulo">No debe nada</p>
          <Insignia tono="exito" icono={CircleCheck}>
            Al día
          </Insignia>
        </>
      )}
      {debe && (
        <>
          <p className="text-dato font-bold leading-titulo">Debe {soles(cuota.debe)}</p>
          <p className="text-texto-secundario">{cuota.rango}</p>
          {cuota.estado === "EN_REVISION" ? (
            <Insignia tono="info" icono={Info}>
              Pago en revisión
            </Insignia>
          ) : (
            <Insignia tono={cuota.rejaSuspendida ? "error" : "aviso"} icono={TriangleAlert}>
              {semanas} pendientes
            </Insignia>
          )}
        </>
      )}
      {cuota.reclamo && (
        <Insignia tono="aviso" icono={TriangleAlert}>
          Reclamo en revisión
        </Insignia>
      )}
      {cuota.estado === "PENDIENTE" ? (
        <>
          {!cuota.rejaSuspendida && <p>Puede ponerse al día cuando pueda.</p>}
          <BotonEnlace href="/cuota/pagar" icono={HandCoins} anchoCompleto>
            Pagar mi cuota
          </BotonEnlace>
        </>
      ) : (
        cuota.estado !== "SIN_CUOTAS" && (
          <Link href="/cuota" className={ENLACE}>
            Ver el detalle de mi cuota
            <ChevronRight aria-hidden className="size-icono shrink-0" />
          </Link>
        )
      )}
    </Tarjeta>
  );
}

// VEC-ACC-09 Inicio del vecino (HU-GAR-19). El panel se compone aquí (modulos/identidad/CLAUDE.md), en este
// orden: lo que espera respuesta, la cuota (M5), la asamblea y la actividad (M4) lado a lado, y a todo el ancho Mis avisos,
// Noticias de la junta y Mis reportes. En vista grande, lo que pasa de 3 va detrás de "Ver más" (R-11). Se lee en cada carga (CA3).
export default async function Inicio() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const [{ avisosSinLeer }, [noticia], reportes, enLaPuerta, { asamblea, actividad }, cuota] =
    await Promise.all([
      bloqueDeIdentidad(sesion),
      ultimasNoticias(sesion, 1),
      bloqueDeReportes(sesion),
      visitaEnLaPuerta(sesion),
      bloqueDeInicio(sesion),
      bloqueDeCuota(sesion),
    ]);
  // El orden del inicio: la asamblea y la actividad lado a lado (en escritorio), y debajo, a todo el ancho, Mis avisos,
  // Noticias de la junta y Mis reportes. Las dos primeras comparten fila; el resto ocupa la fila entera.
  const bloques: { nodo: ReactNode; completo: boolean }[] = [];
  if (asamblea) {
    const cuando = new Date(asamblea.fechaHora);
    bloques.push({
      completo: false,
      nodo: (
        <TarjetaPulsable
          key="asamblea"
          href="/asambleas"
          icono={CalendarDays}
          titulo="Próxima asamblea"
          dato={fechaLarga(cuando, { conAnio: false })}
          accion="Ver la asamblea"
        >
          <span>
            {horaCorta(cuando)} · {asamblea.lugar}
          </span>
          {asamblea.estado === "INFORMATIVA" ? (
            <span className="font-bold">Será una sesión informativa</span>
          ) : asamblea.confirmo ? (
            <Insignia tono="exito" icono={CircleCheck}>
              Usted asistirá
            </Insignia>
          ) : (
            <Insignia tono="info" icono={Info}>
              Falta confirmar
            </Insignia>
          )}
        </TarjetaPulsable>
      ),
    });
  }
  if (actividad) {
    const cuando = new Date(actividad.fechaHora);
    bloques.push({
      completo: false,
      nodo: (
        <TarjetaPulsable
          key="actividad"
          href="/actividades"
          icono={HandHeart}
          titulo="Próxima actividad"
          dato={fechaLarga(cuando, { conAnio: false })}
          accion="Ver la actividad"
        >
          <span>
            {actividad.nombre} · {horaCorta(cuando)}
          </span>
        </TarjetaPulsable>
      ),
    });
  }
  bloques.push({
    completo: true,
    nodo: (
      <FilaEnlace
        key="avisos"
        href="/avisos"
        icono={Bell}
        titulo="Mis avisos"
        extra={
          avisosSinLeer > 0 && (
            <Insignia tono="info" icono={Info}>
              {avisosSinLeer === 1 ? "1 nuevo" : `${avisosSinLeer} nuevos`}
            </Insignia>
          )
        }
      />
    ),
  });
  if (noticia)
    bloques.push({
      completo: true,
      nodo: (
        <FilaEnlace
          key="noticias"
          href="/noticias"
          icono={Megaphone}
          titulo="Noticias de la junta"
          detalle={noticia.titulo}
        />
      ),
    });
  const abiertos =
    reportes.abiertos === 0
      ? "Ninguno abierto"
      : reportes.abiertos === 1
        ? "1 abierto"
        : `${reportes.abiertos} abiertos`;
  bloques.push({
    completo: true,
    nodo: (
      <TarjetaPulsable
        key="reportes"
        href="/incidentes"
        icono={MapPin}
        titulo="Mis reportes"
        dato={abiertos}
        accion="Ver incidentes"
      >
        {reportes.abiertos === 0 ? (
          <span>Si ve un problema en el barrio, puede reportarlo.</span>
        ) : (
          reportes.ultimo && (
            <>
              <span>
                {reportes.ultimo.numero} · {reportes.ultimo.categoria}
              </span>
              <Insignia tono="info" icono={Info}>
                {reportes.ultimo.estado}
              </Insignia>
            </>
          )
        )}
      </TarjetaPulsable>
    ),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-titulo-1">Hola, {primerNombre(sesion.nombreCompleto)}</h1>
        <p className="text-texto-secundario">{fechaLarga(new Date())}</p>
      </div>
      {cuota?.rejaSuspendida && (
        <MensajeEstado tipo="aviso" titulo="Por ahora la reja no se abre sola para su casa">
          <p>Puede entrar abriéndola a mano. Apenas se ponga al día, vuelve a abrirse sola.</p>
          <Link href="/cuota/reja" className={ENLACE}>
            Ver qué pasa y cómo ponerme al día
          </Link>
        </MensajeEstado>
      )}
      {enLaPuerta && (
        <MensajeEstado
          tipo="info"
          icono={DoorOpen}
          titulo={`${enLaPuerta.nombre} está en la garita y pregunta por usted`}
        >
          <p>No estaba anunciado. {enLaPuerta.vigilante}, el vigilante, espera su respuesta.</p>
          <BotonEnlace href={`/visitas/${enLaPuerta.id}/responder`} variante="secundario" anchoCompleto>
            Responder
          </BotonEnlace>
        </MensajeEstado>
      )}
      {cuota && (
        <div data-ancho="completo">
          <TarjetaCuota cuota={cuota} />
        </div>
      )}
      <div data-ancho="completo" className="flex flex-col gap-separacion">
        <ListaVerMas
          etiqueta="Su resumen"
          elementos={bloques.map((b) => b.nodo)}
          anchoCompleto={bloques.map((b) => b.completo)}
          normal={5}
          senior={3}
        />
      </div>
    </div>
  );
}
