// @HU-ASA-10
import { prisma } from "@/compartido/bd/cliente";
import { archivosSubidosPor } from "@/compartido/archivos/registro";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { fechaLarga } from "@/compartido/fechas";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { calcularTotales, type DatosBalance, prepararBalance } from "@/modulos/transparencia/dominio/balance";
import {
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

/**
 * Publica el balance de una actividad pro fondos (HU-ASA-10 CA3): queda inalterable, avisa a cada vecino
 * activo y se audita, todo en una transacción (AC-6, ADR-006). Cada gasto lleva un comprobante que subió
 * quien publica (CA1). Repetir el mismo `idOperacion` devuelve lo ya publicado (AC-5).
 */
export async function publicarBalance(
  sesion: SesionDto,
  datos: DatosBalance & { idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const { errores, balance } = prepararBalance(datos, ahora);
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

  const totales = calcularTotales(balance);
  const creada = await prisma.$transaction(async (tx) => {
    const fila = await crearBalance(tx, {
      ...balance,
      idOperacion: datos.idOperacion,
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
        despues: { titulo: balance.titulo, ...totales, gastos: balance.egresos.length, avisados },
      },
      tx,
    );
    return fila;
  });
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
