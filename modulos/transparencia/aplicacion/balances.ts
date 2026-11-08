// @HU-ASA-10
import { prisma } from "@/compartido/bd/cliente";
import { archivosSubidosPor } from "@/compartido/archivos/registro";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaLarga } from "@/compartido/fechas";
import { verActividad } from "@/modulos/asambleas/aplicacion/actividades";
import { actividadDeUnBalance } from "@/modulos/asambleas/aplicacion/enlaces";
import {
  registrarMovimientoDeActividad,
  resumenDeActividad,
} from "@/modulos/asambleas/aplicacion/movimientosActividad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { calcularTotales, type DatosBalance, prepararBalance } from "@/modulos/transparencia/dominio/balance";
import {
  balanceDeConvocatoria,
  buscarBalance,
  buscarBalancePorIdOperacion,
  crearBalance,
  listarBalances,
} from "@/modulos/transparencia/infraestructura/repositorioPublicaciones";
import { avisarALaComunidad } from "./avisarComunidad";

const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", ...ROLES_DIRECTIVA] as const;
export const USO_COMPROBANTE = "comprobante_egreso";

export type FilaBalance = NonNullable<Awaited<ReturnType<typeof buscarBalance>>>;
type Fila = FilaBalance;

/** Los comprobantes solo los ve la directiva: el vecino ve concepto y monto de cada gasto. */
export const balanceADto = (p: Fila, sesion: SesionDto) => {
  const b = p.balance!;
  const veComprobantes = sesion.roles.some((r) => (ROLES_DIRECTIVA as readonly string[]).includes(r));
  return {
    id: p.id,
    titulo: p.titulo,
    convocatoriaId: b.convocatoriaId,
    fechaActividad: fechaLarga(b.fechaActividad),
    ingresosVirtuales: b.ingresosVirtuales,
    ingresosEnPuerta: b.ingresosEnPuerta,
    egresos: b.egresos.map((e) => ({
      concepto: e.concepto,
      monto: e.monto,
      comprobanteId: veComprobantes ? e.archivoId : null,
    })),
    totales: calcularTotales(b),
    autor: p.autor,
    fecha: p.fechaPublicacion.toISOString(),
  };
};

export type BalanceDto = ReturnType<typeof balanceADto>;

type BalanceListo = {
  titulo: string;
  fechaActividad: Date;
  ingresosVirtuales: number;
  ingresosEnPuerta: number;
  egresos: { concepto: string; monto: number; archivoId: string }[];
  convocatoriaId: string | null;
  idOperacion: string;
};

/** Guarda el balance, avisa a cada vecino y lo audita, todo en una transacción (AC-6, ADR-006). */
async function guardarBalance(sesion: SesionDto, balance: BalanceListo, ahora: Date) {
  const { convocatoriaId } = balance;
  const totales = calcularTotales(balance);
  const creada = await prisma.$transaction(async (tx) => {
    const fila = await crearBalance(tx, {
      ...balance,
      autorId: sesion.usuarioId,
      autor: sesion.nombreCompleto,
      fechaPublicacion: ahora,
    });
    const avisados = await avisarALaComunidad(
      {
        tipo: "ASAMBLEAS",
        titulo: `Balance publicado: ${balance.titulo}`,
        texto: "Ya puede ver cuánto se recaudó y en qué se gastó, en Actas y balances.",
      },
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "publicar_balance",
        entidad: "Balance",
        entidadId: fila.id,
        antes: null,
        despues: {
          titulo: balance.titulo,
          convocatoriaId,
          ...totales,
          gastos: balance.egresos.length,
          avisados,
        },
      },
      tx,
    );
    return fila;
  });
  return creada;
}

/**
 * Publica el balance de una actividad pro fondos (HU-ASA-10 CA3): queda inalterable, avisa a cada vecino
 * activo y se audita, todo en una transacción (AC-6, ADR-006). Cada gasto lleva un comprobante que subió
 * quien publica (CA1). Repetir el mismo `idOperacion` devuelve lo ya publicado (AC-5). Si es el balance de una
 * actividad de la plataforma (`convocatoriaId`), su día es el de la actividad.
 */
export async function publicarBalance(
  sesion: SesionDto,
  datos: DatosBalance & { idOperacion: string; convocatoriaId?: string | null },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const convocatoriaId = datos.convocatoriaId ?? null;
  const fechaActividad = convocatoriaId
    ? (await actividadDeUnBalance(convocatoriaId)).dia
    : datos.fechaActividad;
  const { errores, balance } = prepararBalance({ ...datos, fechaActividad }, ahora);
  const propios = await archivosSubidosPor(
    sesion.usuarioId,
    USO_COMPROBANTE,
    balance.egresos.map((e) => e.archivoId).filter(Boolean),
  );
  balance.egresos.forEach((e, i) => {
    if (e.archivoId && !propios.has(e.archivoId)) {
      errores[`egresos.${i}.archivoId`] = "Adjunte la foto del comprobante de este gasto.";
    }
  });
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);

  const previa = await buscarBalancePorIdOperacion(datos.idOperacion);
  if (previa) return { balance: balanceADto(previa, sesion), creado: false };

  const creada = await guardarBalance(
    sesion,
    { ...balance, convocatoriaId, idOperacion: datos.idOperacion },
    ahora,
  );
  return { balance: balanceADto(creada, sesion), creado: true };
}

/** Un balance publicado (VEC-TRA-03), para todo vecino con sesión. */
export async function verBalance(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const fila = await buscarBalance(id);
  if (!fila) throw new ErrorNoEncontrado();
  return balanceADto(fila, sesion);
}

/** Los balances publicados, los más nuevos primero. */
export async function balancesPublicados(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_VECINO);
  return (await listarBalances()).map((f) => balanceADto(f, sesion));
}

/**
 * Publica el balance de una actividad de la plataforma con lo que la directiva fue anotando (prototipo DAS09 y DCF16): lo
 * pagado por adelantado, lo cobrado en la puerta y los gastos con su comprobante. Solo cuando la actividad ya se hizo y una
 * sola vez por actividad. Repetir el mismo `idOperacion` devuelve lo ya publicado (AC-5).
 */
export async function publicarBalanceDeActividad(
  sesion: SesionDto,
  actividadId: string,
  idOperacion: string,
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const previa = await buscarBalancePorIdOperacion(idOperacion);
  if (previa) return { balance: balanceADto(previa, sesion), creado: false };
  const actividad = await verActividad(sesion, actividadId);
  const fecha = new Date(actividad.fechaHora);
  if (fecha > ahora) throw new ErrorReglaNegocio("El balance se publica cuando la actividad ya se hizo.");
  if (await balanceDeConvocatoria(actividadId)) {
    throw new ErrorReglaNegocio("El balance de esta actividad ya se publicó.");
  }
  const resumen = await resumenDeActividad(sesion, actividadId);
  const creada = await guardarBalance(
    sesion,
    {
      titulo: actividad.nombre,
      fechaActividad: fecha,
      ingresosVirtuales: resumen.totales.ingresosVirtuales,
      ingresosEnPuerta: resumen.totales.ingresosEnPuerta,
      egresos: resumen.gastos.map((g) => ({ concepto: g.concepto, monto: g.monto, archivoId: g.archivoId! })),
      convocatoriaId: actividadId,
      idOperacion,
    },
    ahora,
  );
  return { balance: balanceADto(creada, sesion), creado: true };
}

/** El balance publicado de una actividad de la plataforma, o null si todavía no tiene. */
export async function balanceDeLaActividad(sesion: SesionDto, actividadId: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const fila = await balanceDeConvocatoria(actividadId);
  return fila ? balanceADto(fila, sesion) : null;
}

/**
 * Anota un gasto o un cobro en la puerta de una actividad (HU-ASA-10) mientras su balance no esté publicado: publicado, el
 * balance ya no cambia (CA3).
 */
export async function anotarEnActividad(
  sesion: SesionDto,
  actividadId: string,
  datos: Parameters<typeof registrarMovimientoDeActividad>[2],
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  if (await balanceDeConvocatoria(actividadId)) {
    throw new ErrorReglaNegocio(
      "El balance de esta actividad ya se publicó: no se pueden anotar más gastos ni cobros.",
    );
  }
  return registrarMovimientoDeActividad(sesion, actividadId, datos);
}
