import type { LucideIcon } from "lucide-react";
import { House, Lightbulb, LifeBuoy, MapPin, Printer, Receipt, Scale } from "lucide-react";
import { solicitudesPorAtender } from "@/modulos/accesibilidad/aplicacion/mediacion";
import { bandejaDeCobros } from "@/modulos/aportes/aplicacion/inicio";
import { proximaAsamblea } from "@/modulos/asambleas/aplicacion/convocatorias";
import { bandejaDePropuestas } from "@/modulos/asambleas/aplicacion/propuestas";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { quejasPorAtender } from "@/modulos/incidencias/aplicacion/quejas";

// Lo que espera a la directiva (prototipo DIN01 "Para atender" y DIN05): una bandeja por cosa, con cuántas hay,
// primero las que tienen algo pendiente. Las mismas cifras salen del resumen y de la pantalla "Para atender".

export type Bandeja = { icono: LucideIcon; titulo: string; n: number; detalle: string; href: string };

export async function bandejasDeLaDirectiva(sesion: SesionDto, ahora = new Date()) {
  const [cobros, quejas, pedidos, asamblea] = await Promise.all([
    bandejaDeCobros(sesion),
    quejasPorAtender(sesion),
    solicitudesPorAtender({
      usuarioId: sesion.usuarioId,
      nombre: sesion.nombreCompleto,
      roles: sesion.roles,
    }),
    proximaAsamblea(sesion, ahora),
  ]);
  const propuestas = asamblea
    ? (await bandejaDePropuestas(sesion, asamblea.id)).filter((p) => p.estado === "PENDIENTE_REVISION").length
    : 0;
  const pedidosPendientes = pedidos.filter((p) => p.estado !== "ATENDIDA").length;
  const todas: Bandeja[] = [
    {
      icono: Receipt,
      titulo: "Comprobantes por revisar",
      n: cobros.comprobantes,
      detalle: "Pagos con Yape, Plin o transferencia",
      href: "/directiva/cobros",
    },
    {
      icono: House,
      titulo: "Cobros en casa",
      n: cobros.cobrosEnCasa,
      detalle: cobros.cobrosEnCasa
        ? "Hay vecinos que pidieron que vayan a cobrar"
        : "No hay visitas pendientes",
      href: "/directiva/cobros",
    },
    {
      icono: Scale,
      titulo: "Reclamos de cuota",
      n: cobros.reclamos,
      detalle: "Vecinos que creen que su cuota no es correcta",
      href: "/directiva/cobros",
    },
    {
      icono: MapPin,
      titulo: "Incidentes por evaluar",
      n: quejas.porEvaluar,
      detalle: quejas.porEvaluar ? "Reportes nuevos de los vecinos" : "Revise la bandeja de incidentes",
      href: "/directiva/incidentes?estado=porEvaluar",
    },
    {
      icono: LifeBuoy,
      titulo: "Pedidos de ayuda",
      n: pedidosPendientes,
      detalle: pedidosPendientes ? "Vecinos que pidieron ayuda de una persona" : "Todos atendidos",
      href: "/directiva/pedidos-de-ayuda",
    },
    {
      icono: Lightbulb,
      titulo: "Propuestas para la agenda",
      n: propuestas,
      detalle: asamblea ? "Propuestas de los vecinos para la próxima asamblea" : "No hay asamblea convocada",
      href: "/directiva/asambleas/propuestas",
    },
    {
      icono: Printer,
      titulo: "Recibos en papel",
      n: cobros.recibosEnPapel,
      detalle: "Vecinos que pidieron su recibo impreso",
      href: "/directiva/cobros",
    },
  ];
  const conPendiente = todas.filter((b) => b.n > 0);
  const total = conPendiente.reduce((suma, b) => suma + b.n, 0);
  return {
    total,
    texto:
      total === 0
        ? "No hay nada pendiente"
        : total === 1
          ? "Hay 1 cosa por atender"
          : `Hay ${total} cosas por atender`,
    conPendiente,
    ordenadas: [...conPendiente, ...todas.filter((b) => b.n === 0)],
  };
}
