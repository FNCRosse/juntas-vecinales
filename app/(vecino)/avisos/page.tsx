import {
  Bell,
  CalendarDays,
  DoorOpen,
  Info,
  type LucideIcon,
  MapPin,
  Megaphone,
  Settings,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { fechaYHora } from "@/compartido/fechas";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { FiltroEnHoja } from "@/componentes/a11y/FiltroEnHoja";
import { Insignia } from "@/componentes/a11y/Insignia";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { FILTROS, type Filtro, type ORIGEN, verAvisos } from "@/modulos/identidad/aplicacion/avisos";
import { AvisoDeLectura, MarcarLeido, MarcarTodos, ProveedorLectura } from "./Marcar";

export const metadata: Metadata = { title: "Avisos" };

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR"] as const;

/** El ícono del módulo que mandó el aviso, junto a su nombre (prototipo C-05 Tarjeta · Aviso). */
const ICONO_ORIGEN: Record<keyof typeof ORIGEN, LucideIcon> = {
  CUENTA: UserRound,
  SEGURIDAD: ShieldCheck,
  PAGOS: Wallet,
  ASAMBLEAS: CalendarDays,
  REPORTES: MapPin,
  GARITA: DoorOpen,
  NOTICIAS: Megaphone,
};

// VEC-ACC-11 Avisos (HU-GAR-20): todos los avisos, los más nuevos arriba, con su origen; filtro por
// tipo en la URL, detrás de un solo botón "Filtrar" (R-11); 5 avisos (3 en vista grande) y "Ver más".
export default async function Avisos({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const sesion = await exigirActor([...ROLES_VECINO], "/entrar");
  const { tipo } = await searchParams;
  const filtro: Filtro = tipo && tipo in FILTROS ? (tipo as Filtro) : "todos";
  const { avisos, noLeidos } = await verAvisos(sesion, filtro);

  return (
    <ProveedorLectura>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-titulo-1">Avisos</h1>
          <p className="text-texto-secundario">
            {noLeidos === 1 ? "1 sin leer" : `${noLeidos} sin leer`} · los más nuevos arriba
          </p>
        </div>
        <AvisoDeLectura />
        <FiltroEnHoja
          actual={FILTROS[filtro].etiqueta}
          titulo="Mostrar avisos de"
          opciones={(Object.keys(FILTROS) as Filtro[]).map((clave) => ({
            etiqueta: FILTROS[clave].etiqueta,
            href: clave === "todos" ? "/avisos" : `/avisos?tipo=${clave}`,
            activa: clave === filtro,
          }))}
          pie={
            <BotonEnlace href="/avisos/preferencias" variante="secundario" icono={Settings} anchoCompleto>
              Elegir qué avisos recibo
            </BotonEnlace>
          }
        />

        {avisos.length ? (
          <ListaVerMas
            etiqueta="Avisos"
            elementos={avisos.map((a) => {
              const Icono = ICONO_ORIGEN[a.tipo];
              return (
                <article
                  key={a.id}
                  className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-2 font-bold text-accion-primaria">
                      <Icono aria-hidden className="size-icono shrink-0" />
                      {a.origen}
                    </span>
                    <span className="text-pequeno text-texto-secundario">
                      {fechaYHora(new Date(a.fecha))}
                    </span>
                    {a.nuevo && (
                      <Insignia tono="info" icono={Info}>
                        Nuevo
                      </Insignia>
                    )}
                  </div>
                  <h2 className="text-titulo-3">{a.titulo}</h2>
                  <p>{a.texto}</p>
                  {a.nuevo && <MarcarLeido id={a.id} titulo={a.titulo} />}
                </article>
              );
            })}
          />
        ) : (
          <div role="status" className="flex flex-col items-center gap-2 px-4 pt-16 pb-8 text-center">
            <Bell aria-hidden className="size-icono text-texto-secundario" />
            <strong>No tiene avisos de este tipo</strong>
            <span className="text-texto-secundario">Cuando llegue uno, lo verá aquí.</span>
          </div>
        )}

        {noLeidos > 0 && <MarcarTodos />}
      </div>
    </ProveedorLectura>
  );
}
