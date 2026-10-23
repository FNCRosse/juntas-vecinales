// @HU-COB-12
import { generarPdf } from "@/compartido/archivos/pdf";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import type { Recibo } from "@/compartido/bd/generado/client";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaCorta, fechaYHora } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import {
  codigoDeVerificacion,
  FRANJAS,
  FRANJAS_DE_VISITA,
  numeroDePedido,
  numeroDeRecibo,
  prepararPedidoDeRecibo,
} from "@/modulos/aportes/dominio/recibo";
import { bloquearCasa } from "@/modulos/aportes/infraestructura/repositorioPagos";
import {
  crearPedido,
  pedidoAbierto,
  pedidoPorId,
  pedidoPorIdOperacion,
  pedidosPorEntregar,
  reciboEnviadoDeLaCasa,
  reciboPorId,
  recibosEnviadosDe,
  reclamarConfirmacion,
  reclamarEntrega,
  reclamarEnvio,
} from "@/modulos/aportes/infraestructura/repositorioRecibos";
import { directivaParaAvisar, nombresDe, telefonoDe } from "@/modulos/identidad/aplicacion/barrio";
import { predioDelVecino } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;
const ROLES_DIRECTIVA = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

/** El recibo como lo leen la directiva y la casa: lo que dice el papel, sin ids internos. */
export function aReciboDto(r: Recibo) {
  return {
    id: r.id,
    numero: numeroDeRecibo(r.numero),
    titular: r.titular,
    vivienda: r.vivienda,
    fecha: fechaCorta(r.fecha),
    concepto: r.concepto,
    medio: r.medio,
    monto: r.monto,
    registradoPor: r.registradoPor,
    codigo: codigoDeVerificacion(r.numero, r.pagoId, r.monto),
    enviado: r.enviadoEn ? fechaYHora(r.enviadoEn) : null,
    confirmado: r.confirmadoEn ? fechaYHora(r.confirmadoEn) : null,
  };
}

export type ReciboDto = ReturnType<typeof aReciboDto>;

const lineaDelRecibo = (r: Recibo) => `N.° ${numeroDeRecibo(r.numero)} · ${soles(r.monto)}`;

/** El recibo oficial en PDF, con lo mismo que el papel. No se puede modificar: sale siempre de la fila inalterable. */
async function aPdf(recibo: Recibo) {
  const dto = aReciboDto(recibo);
  const pdf = await generarPdf({
    titulo: "Recibo oficial de cuota de vigilancia",
    subtitulos: [`N.° ${dto.numero}`, "Junta Vecinal de Villa de Fátima"],
    secciones: [
      {
        titulo: "Su pago",
        filas: [
          ["Vecino o vecina", dto.titular],
          ["Predio", dto.vivienda],
          ["Fecha", dto.fecha],
          ["Concepto", dto.concepto],
          ["Medio de pago", dto.medio],
          ["Registrado por", dto.registradoPor],
          ["Código de verificación", dto.codigo],
          ["Total", soles(dto.monto)],
        ],
      },
    ],
    pie: "Este recibo digital no se puede modificar. Vale igual que el de papel.",
  });
  return { pdf, nombreArchivo: `recibo-${dto.numero}.pdf` };
}

/** Recibo oficial (DIR-COB-04): la directiva y los mediadores lo ven; enviarlo a la app, solo la directiva. */
export async function verReciboDeLaDirectiva(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const recibo = await reciboPorId(id);
  if (!recibo) throw new ErrorNoEncontrado();
  return { ...aReciboDto(recibo), puedeEnviar: sesion.roles.includes("DIRECTIVA") };
}

/**
 * «Enviarlo a la app» (HU-COB-12 CA3): el recibo aparece en Mis pagos y recibos de quien pagó, que recibe un aviso para
 * abrirlo y confirmar que lo recibió. Solo la directiva. Enviarlo dos veces no avisa dos veces (AC-5) y queda en la
 * auditoría en la misma transacción (AC-6).
 */
export async function enviarReciboALaApp(sesion: SesionDto, id: string, ahora = new Date()) {
  exigirRol(sesion, "DIRECTIVA");
  const recibo = await reciboPorId(id);
  if (!recibo) throw new ErrorNoEncontrado();
  const aplicado = await prisma.$transaction(async (tx) => {
    if (!(await reclamarEnvio(tx, recibo.id, ahora))) return false;
    await encolarAvisos(
      [
        {
          destinatarioId: recibo.pago.autorId,
          tipo: "PAGOS" as const,
          titulo: "Su recibo está listo",
          texto: `Su recibo N.° ${numeroDeRecibo(recibo.numero)} por ${soles(recibo.monto)} ya está en Mis pagos y recibos. Ábralo y confirme que lo recibió.`,
        },
      ],
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "enviar_recibo",
        entidad: "Recibo",
        entidadId: recibo.id,
        antes: null,
        despues: { recibo: numeroDeRecibo(recibo.numero), monto: soles(recibo.monto) },
      },
      tx,
    );
    return true;
  });
  return { aplicado, recibo: await verReciboDeLaDirectiva(sesion, id) };
}

/** El recibo de la casa (VEC-COB-06): solo si ya se lo enviaron y solo de su casa (AC-7). */
export async function verMiRecibo(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  const recibo = casa ? await reciboEnviadoDeLaCasa(casa.id, id) : null;
  if (!recibo) throw new ErrorNoEncontrado();
  return {
    ...aReciboDto(recibo),
    puedeConfirmar: recibo.confirmadoEn === null,
    puedePedirEnPapel: recibo.pedidos.length === 0,
  };
}

export type MiRecibo = Awaited<ReturnType<typeof verMiRecibo>>;

/** La casa confirma que recibió su recibo (CA3). Confirmar dos veces cambia una sola vez (AC-5). */
export async function confirmarRecibo(sesion: SesionDto, id: string, ahora = new Date()) {
  const recibo = await verMiRecibo(sesion, id);
  const aplicado = await prisma.$transaction(async (tx) => {
    if (!(await reclamarConfirmacion(tx, recibo.id, ahora))) return false;
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "confirmar_recibo",
        entidad: "Recibo",
        entidadId: recibo.id,
        antes: null,
        despues: { recibo: recibo.numero },
      },
      tx,
    );
    return true;
  });
  return { aplicado, recibo: await verMiRecibo(sesion, id) };
}

/** El PDF del recibo: la directiva ve cualquiera; la casa, solo los suyos y ya enviados (AC-7). */
export async function pdfDelRecibo(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  if (ROLES_DIRECTIVA.some((rol) => sesion.roles.includes(rol))) {
    const recibo = await reciboPorId(id);
    if (!recibo) throw new ErrorNoEncontrado();
    return aPdf(recibo);
  }
  const casa = await predioDelVecino(sesion.usuarioId);
  const recibo = casa ? await reciboEnviadoDeLaCasa(casa.id, id) : null;
  if (!recibo) throw new ErrorNoEncontrado();
  return aPdf(recibo);
}

/** Lo que necesita «Pedir mi recibo en papel» (VEC-COB-14): sus recibos ya enviados y las franjas de visita. */
export async function datosParaPedirRecibo(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_VECINO);
  const casa = await predioDelVecino(sesion.usuarioId);
  if (!casa) throw new ErrorNoEncontrado();
  const [recibos, telefono] = await Promise.all([recibosEnviadosDe(casa.id), telefonoDe(sesion.usuarioId)]);
  return {
    quienPide: sesion.nombreCompleto,
    direccion: casa.vivienda,
    telefono: telefono ? `terminado en ${telefono.slice(-3)}` : "sin número registrado",
    recibos: recibos
      .filter((r) => r.pedidos.length === 0)
      .map((r) => ({
        valor: r.id,
        etiqueta: `Recibo ${lineaDelRecibo(r)}`,
        detalle: fechaCorta(r.fecha),
      })),
    franjas: FRANJAS_DE_VISITA.map((valor) => ({
      valor,
      etiqueta: FRANJAS[valor].etiqueta,
      detalle: FRANJAS[valor].detalle,
    })),
  };
}

export type DatosParaPedirRecibo = Awaited<ReturnType<typeof datosParaPedirRecibo>>;

type PedidoConRecibo = NonNullable<Awaited<ReturnType<typeof pedidoPorIdOperacion>>>;

const aPedidoDto = (p: PedidoConRecibo) => ({
  id: p.id,
  numero: numeroDePedido(p.numero),
  enviado: fechaYHora(p.creadoEn),
  recibo: lineaDelRecibo(p.recibo),
  donde: `En su casa, ${p.recibo.vivienda}`,
  franja: FRANJAS[p.franja].resumen,
  estado: p.estado === "ENTREGADO" ? "Entregado" : "Pendiente de visita",
});

/**
 * La casa pide su recibo en papel (HU-COB-12 CA2, VEC-COB-14 y 15): la directiva se lo lleva en la franja que eligió.
 * Solo de un recibo suyo ya enviado (AC-7) y sin otro pedido abierto del mismo recibo. Repetir el mismo
 * `idOperacion` devuelve el pedido ya hecho sin avisar otra vez (AC-5); el aviso y la auditoría van en la misma transacción.
 */
export async function pedirReciboEnPapel(
  sesion: SesionDto,
  datos: { reciboId: string; franja: string; nota?: string; idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, ...ROLES_VECINO);
  const previo = await pedidoPorIdOperacion(datos.idOperacion);
  if (previo) {
    if (previo.solicitanteId !== sesion.usuarioId) throw new ErrorNoEncontrado();
    return { pedido: aPedidoDto(previo), creado: false };
  }
  const { errores, pedido } = prepararPedidoDeRecibo({
    reciboId: datos.reciboId,
    franja: datos.franja,
    nota: datos.nota ?? "",
  });
  if (!pedido) throw new ErrorValidacion(undefined, errores);
  const casa = await predioDelVecino(sesion.usuarioId);
  const recibo = casa ? await reciboEnviadoDeLaCasa(casa.id, pedido.reciboId) : null;
  if (!casa || !recibo) throw new ErrorNoEncontrado();

  const destinatarios = await directivaParaAvisar();
  const creado = await prisma.$transaction(async (tx) => {
    await bloquearCasa(tx, casa.id);
    if (await pedidoAbierto(tx, recibo.id)) {
      throw new ErrorReglaNegocio("Ya pidió ese recibo. La directiva se lo llevará a su casa.");
    }
    const fila = await crearPedido(tx, {
      idOperacion: datos.idOperacion,
      reciboId: recibo.id,
      solicitanteId: sesion.usuarioId,
      franja: pedido.franja,
      nota: pedido.nota,
      creadoEn: ahora,
    });
    await encolarAvisos(
      destinatarios.map((destinatarioId) => ({
        destinatarioId,
        tipo: "PAGOS" as const,
        titulo: "Pidieron un recibo en papel",
        texto: `${recibo.titular} (${recibo.vivienda}) pidió su recibo N.° ${numeroDeRecibo(recibo.numero)} impreso. Véalo en Cobros.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "pedir_recibo_papel",
        entidad: "PedidoReciboPapel",
        entidadId: fila.id,
        antes: null,
        despues: { pedido: numeroDePedido(fila.numero), recibo: numeroDeRecibo(recibo.numero) },
      },
      tx,
    );
    return fila;
  });
  return { pedido: aPedidoDto(creado), creado: true };
}

/** Cobros: los recibos en papel por entregar (DIR-COB-11), el más reciente primero. */
export async function recibosEnPapelPorEntregar(sesion: SesionDto) {
  exigirRol(sesion, ...ROLES_DIRECTIVA);
  const pedidos = await pedidosPorEntregar();
  const nombres = await nombresDe([...new Set(pedidos.map((p) => p.solicitanteId))]);
  return {
    items: pedidos.map((p) => ({
      id: p.id,
      numero: numeroDePedido(p.numero),
      reciboId: p.reciboId,
      nombre: nombres.get(p.solicitanteId) ?? p.recibo.titular,
      vivienda: p.recibo.vivienda,
      recibo: `Recibo ${lineaDelRecibo(p.recibo)}`,
      fecha: fechaCorta(p.creadoEn),
      franja: FRANJAS[p.franja].resumen,
      nota: p.nota,
      puedeEntregar: sesion.roles.includes("DIRECTIVA"),
    })),
  };
}

export type RecibosEnPapelPorEntregar = Awaited<ReturnType<typeof recibosEnPapelPorEntregar>>;

/** «Marcar como entregado» (DIR-COB-11): solo la directiva. Marcarlo dos veces cambia una sola vez (AC-5) y se audita (AC-6). */
export async function entregarReciboEnPapel(sesion: SesionDto, pedidoId: string, ahora = new Date()) {
  exigirRol(sesion, "DIRECTIVA");
  const pedido = await pedidoPorId(pedidoId);
  if (!pedido) throw new ErrorNoEncontrado();
  const aplicado = await prisma.$transaction(async (tx) => {
    if (!(await reclamarEntrega(tx, pedido.id, ahora, sesion.usuarioId))) return false;
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "entregar_recibo_papel",
        entidad: "PedidoReciboPapel",
        entidadId: pedido.id,
        antes: null,
        despues: { pedido: numeroDePedido(pedido.numero) },
      },
      tx,
    );
    return true;
  });
  return { aplicado, pedidoId: pedido.id };
}
