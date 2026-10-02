// @HU-GAR-12 @HU-GAR-13 @HU-GAR-16
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import type { SeccionPdf } from "@/compartido/archivos/pdf";
import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import { ErrorConflicto, ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaLarga, fechaYHora, primerNombre } from "@/compartido/fechas";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { plantillaSolicitudPrivacidad } from "@/compartido/notificaciones/plantillas";
import {
  CAMPOS,
  type CampoRectificable,
  errorDeRectificacion,
  estadoDelPlazo,
  fechaLimite,
  leerVivienda,
  numeroDeSolicitud,
  TIPOS_ARCO,
  type TipoArco,
} from "@/modulos/identidad/dominio/arco";
import { NOMBRE_RELACION } from "@/modulos/identidad/dominio/empadronamiento";
import { direccion } from "@/modulos/identidad/dominio/predio";
import {
  cerrarSolicitud,
  contarPendientes,
  crearSolicitud,
  nombreDeUsuario,
  pendienteDelMismoCampo,
  solicitudConVecino,
  solicitudesDelVecino,
  solicitudesParaLaBandeja,
} from "@/modulos/identidad/infraestructura/repositorioArco";
import { buscarPredioPorLote, cerrarResidencia } from "@/modulos/identidad/infraestructura/repositorioPadron";
import { exigirRol, type SesionDto } from "./sesion";

export { CAMPOS, TIPOS_ARCO };
export type { CampoRectificable, TipoArco };

type Solicitud = NonNullable<Awaited<ReturnType<typeof solicitudConVecino>>>;

function titulo(s: { tipo: TipoArco; campo: CampoRectificable | null }) {
  if (s.tipo === "RECTIFICACION" && s.campo) return `Corregir ${CAMPOS[s.campo].nombre}`;
  return {
    ACCESO: "Copia de sus datos personales",
    RECTIFICACION: "Corregir un dato",
    CANCELACION: "Cancelar su cuenta y sus datos",
    OPOSICION: "No mostrar su ubicación exacta en el mapa",
  }[s.tipo];
}

async function cargarUsuario(usuarioId: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: { residencias: { where: { fechaFin: null }, include: { predio: true }, take: 1 } },
  });
  if (!usuario) throw new ErrorNoEncontrado();
  return usuario;
}

const terminaEn = (texto: string | null, cifras: number) =>
  texto ? `Terminado en ${texto.slice(-cifras)}` : "—";

// ── Vecino ────────────────────────────────────────────────────────────────────

/** Mis datos (VEC-ACC-13): lo justo para reconocerlos, sin mostrar el DNI ni el teléfono completos. */
export async function miPerfil(sesion: SesionDto) {
  const usuario = await cargarUsuario(sesion.usuarioId);
  const residencia = usuario.residencias[0];
  const solicitudes = await solicitudesDelVecino(sesion.usuarioId);
  return {
    nombre: usuario.nombreCompleto,
    dni: terminaEn(usuario.dni, 2),
    vivienda: residencia ? direccion(residencia.predio) : "Sin vivienda en el padrón",
    whatsapp: terminaEn(usuario.telefonoWhatsApp, 3),
    solicitudes: solicitudes.map((s) => ({
      id: s.id,
      numero: numeroDeSolicitud(s.numero),
      titulo: titulo(s),
      estado: s.estado,
      fecha: fechaLarga(s.creadaEn),
      motivo: s.motivoResolucion,
    })),
  };
}

/**
 * Pide la copia de sus datos (HU-GAR-12): se resuelve sola y queda registrada con fecha y hora en la
 * solicitud y en la auditoría (CA2). El PDF lo arma `app/` con `datosPersonales` de cada módulo.
 */
export async function solicitarCopia(sesion: SesionDto, ahora = new Date()) {
  const solicitud = await prisma.$transaction(async (tx) => {
    const creada = await crearSolicitud(tx, {
      usuarioId: sesion.usuarioId,
      tipo: "ACCESO",
      estado: "RESUELTA_SOLA",
      creadaEn: ahora,
      resueltaEn: ahora,
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "descargar_copia_datos",
        entidad: "SolicitudArco",
        entidadId: creada.id,
        antes: null,
        despues: { numero: numeroDeSolicitud(creada.numero), fecha: ahora.toISOString() },
      },
      tx,
    );
    return creada;
  });
  return { id: solicitud.id, numero: numeroDeSolicitud(solicitud.numero), fecha: fechaYHora(ahora) };
}

/** Solo quien pidió la copia la descarga, y solo con sus propios datos (CA3); otra persona: 404. */
export async function copiaAutorizada(sesion: SesionDto, id: string) {
  const solicitud = await solicitudConVecino(id);
  if (!solicitud || solicitud.tipo !== "ACCESO" || solicitud.usuarioId !== sesion.usuarioId)
    throw new ErrorNoEncontrado();
  return {
    usuarioId: solicitud.usuarioId,
    numero: numeroDeSolicitud(solicitud.numero),
    fecha: fechaYHora(solicitud.creadaEn),
  };
}

/**
 * La sección de identidad de la copia (HU-GAR-12 CA1): sus datos y su vivienda, nunca los de otros
 * residentes ni los de sus visitas (CA3).
 */
export async function datosPersonales(usuarioId: string): Promise<SeccionPdf[]> {
  const usuario = await cargarUsuario(usuarioId);
  const [visitas, credencial] = await Promise.all([
    prisma.visita.count({ where: { registradaPor: usuarioId } }),
    prisma.credencialRespaldo.count({ where: { usuarioId } }),
  ]);
  const residencia = usuario.residencias[0];
  return [
    {
      titulo: "Identidad y contacto",
      filas: [
        ["Nombre", usuario.nombreCompleto],
        ["DNI", usuario.dni],
        [
          "WhatsApp",
          usuario.telefonoWhatsApp?.replace(/^51(\d{3})(\d{3})(\d{3})$/, "+51 $1 $2 $3") ?? "No registrado",
        ],
        ["Empadronado el", fechaLarga(usuario.fechaEmpadronamiento)],
        ["Estado de la cuenta", usuario.estado === "ACTIVA" ? "Activa" : "Sin acceso"],
        ["Clave de respaldo", credencial ? "Sí tiene" : "No tiene"],
        [
          "Política de privacidad",
          usuario.politicaAceptadaEn
            ? `Versión ${usuario.politicaVersion}, aceptada el ${fechaYHora(usuario.politicaAceptadaEn)}`
            : "Todavía no la aceptó",
        ],
      ],
    },
    {
      titulo: "Vivienda",
      filas: residencia
        ? [
            ["Vivienda", direccion(residencia.predio)],
            ["Relación", NOMBRE_RELACION[residencia.relacion]],
            ["Desde", fechaLarga(residencia.fechaInicio)],
            ["Visitas que registró", String(visitas)],
          ]
        : [["Vivienda", "Sin vivienda en el padrón"]],
    },
  ];
}

/**
 * Pide corregir su nombre, su DNI o su vivienda (HU-GAR-13 CA1). Queda "Pendiente de revisión" hasta
 * que el administrador la resuelva (CA2).
 */
export async function solicitarRectificacion(
  sesion: SesionDto,
  datos: { campo: CampoRectificable; valor: string; detalle?: string },
  ahora = new Date(),
) {
  const usuario = await cargarUsuario(sesion.usuarioId);
  const residencia = usuario.residencias[0];
  const anterior = {
    NOMBRE: usuario.nombreCompleto,
    DNI: usuario.dni,
    DIRECCION: residencia ? direccion(residencia.predio) : "",
  }[datos.campo];
  if (datos.campo === "DIRECCION" && !residencia)
    throw new ErrorReglaNegocio("No tiene vivienda en el padrón. Pida ayuda a la administración.");
  const vivienda = datos.campo === "DIRECCION" ? leerVivienda(datos.valor) : null;
  const nuevo = vivienda ? direccion(vivienda) : datos.valor.trim();
  const error =
    errorDeRectificacion(datos.campo, datos.valor, anterior) ??
    (nuevo === anterior ? "Es igual al dato que ya tenemos." : null);
  if (error) throw new ErrorValidacion(undefined, { valor: error });
  if (await pendienteDelMismoCampo(sesion.usuarioId, datos.campo))
    throw new ErrorConflicto("Ya pidió corregir ese dato. Espere la respuesta de la administración.");
  const solicitud = await prisma.$transaction((tx) =>
    crearSolicitud(tx, {
      usuarioId: sesion.usuarioId,
      tipo: "RECTIFICACION",
      campo: datos.campo,
      valorAnterior: anterior,
      valorNuevo: nuevo,
      detalle: datos.detalle?.trim() || null,
      creadaEn: ahora,
    }),
  );
  return { id: solicitud.id, numero: numeroDeSolicitud(solicitud.numero) };
}

// ── Administración (HU-GAR-16) ─────────────────────────────────────────────────

const exigirAdministracion = (sesion: SesionDto) => exigirRol(sesion, "ADMINISTRADOR");

function insignia(s: Solicitud, ahora: Date) {
  if (s.estado === "RESUELTA_SOLA") return { tipo: "exito" as const, texto: "Resuelta sola" };
  if (s.estado === "APROBADA") return { tipo: "exito" as const, texto: "Aprobada" };
  if (s.estado === "RECHAZADA") return { tipo: "info" as const, texto: "Rechazada" };
  const { restantes, porVencer } = estadoDelPlazo(s.creadaEn, s.tipo, ahora);
  if (restantes < 0) return { tipo: "error" as const, texto: "Venció el plazo" };
  if (restantes === 0) return { tipo: "aviso" as const, texto: "Vence hoy" };
  if (porVencer)
    return {
      tipo: "aviso" as const,
      texto: `Vence en ${restantes} ${restantes === 1 ? "día hábil" : "días hábiles"}`,
    };
  return { tipo: "info" as const, texto: "Pendiente" };
}

async function aFila(s: Solicitud, ahora: Date) {
  const vivienda = s.usuario.residencias[0]?.predio;
  const { usados, plazo } = estadoDelPlazo(s.creadaEn, s.tipo, ahora);
  const resolvio = await nombreDeUsuario(s.resueltaPor);
  return {
    id: s.id,
    numero: numeroDeSolicitud(s.numero),
    tipo: s.tipo,
    tipoTexto: TIPOS_ARCO[s.tipo],
    titulo: titulo(s),
    quien: vivienda ? `${s.usuario.nombreCompleto} · ${direccion(vivienda)}` : s.usuario.nombreCompleto,
    recibida: fechaLarga(s.creadaEn),
    pendiente: s.estado === "PENDIENTE",
    plazoTexto:
      s.estado === "RESUELTA_SOLA"
        ? s.tipo === "ACCESO"
          ? `Descargó su copia en PDF desde la app el ${fechaYHora(s.creadaEn)}. Solo tenía sus datos.`
          : "Se aplicó sola, también a sus reportes anteriores."
        : s.estado === "PENDIENTE"
          ? `Van ${usados} de ${plazo} días hábiles`
          : `${s.estado === "APROBADA" ? "Aprobada" : "Rechazada"} el ${fechaLarga(s.resueltaEn ?? s.creadaEn)} por ${resolvio ?? "la administración"}`,
    insignia: insignia(s, ahora),
  };
}

export type FilaArco = Awaited<ReturnType<typeof aFila>>;

/** Bandeja única de solicitudes (ADM-ARC-01): por tipo, con el plazo de cada una (CA1 y CA2). */
export async function bandejaArco(sesion: SesionDto, tipo?: TipoArco, ahora = new Date()) {
  exigirAdministracion(sesion);
  const solicitudes = await solicitudesParaLaBandeja(tipo);
  // Primero las pendientes, de la más antigua a la más nueva (la que vence antes); luego el resto.
  const pendientes = solicitudes.filter((s) => s.estado === "PENDIENTE").reverse();
  const resto = solicitudes.filter((s) => s.estado !== "PENDIENTE");
  return Promise.all([...pendientes, ...resto].map((s) => aFila(s, ahora)));
}

/** Para el inicio y la navegación de la administración: cuántas esperan y cuántas vencen pronto. */
export async function resumenArco(sesion: SesionDto, ahora = new Date()) {
  exigirAdministracion(sesion);
  const pendientes = await contarPendientes();
  return {
    pendientes: pendientes.length,
    porVencer: pendientes.filter((p) => estadoDelPlazo(p.creadaEn, p.tipo, ahora).porVencer).length,
  };
}

/** Ficha para resolver (ADM-ARC-02): el dato actual, el nuevo, el sustento y el plazo. */
export async function verSolicitudArco(sesion: SesionDto, id: string, ahora = new Date()) {
  exigirAdministracion(sesion);
  const s = await solicitudConVecino(id);
  if (!s) throw new ErrorNoEncontrado();
  return {
    ...(await aFila(s, ahora)),
    nombre: s.usuario.nombreCompleto,
    campo: s.campo ? CAMPOS[s.campo].nombre : null,
    antes: s.valorAnterior,
    nuevo: s.valorNuevo,
    detalle: s.detalle,
    vence: fechaLarga(fechaLimite(s.creadaEn, s.tipo)),
    motivoResolucion: s.motivoResolucion,
  };
}

async function aplicarRectificacion(tx: Transaccion, s: Solicitud, ahora: Date) {
  const valor = s.valorNuevo ?? "";
  if (s.campo === "NOMBRE") {
    await tx.usuario.update({ where: { id: s.usuarioId }, data: { nombreCompleto: valor } });
  } else if (s.campo === "DNI") {
    const otro = await tx.usuario.findUnique({ where: { dni: valor } });
    if (otro && otro.id !== s.usuarioId)
      throw new ErrorConflicto("Ese DNI ya es de otra persona del padrón.");
    await tx.usuario.update({ where: { id: s.usuarioId }, data: { dni: valor } });
  } else if (s.campo === "DIRECCION") {
    const lote = leerVivienda(valor);
    const destino = lote && (await buscarPredioPorLote(lote.manzana, lote.lote));
    if (!destino)
      throw new ErrorReglaNegocio(`${valor} no está en el padrón. Empadrone esa vivienda antes de aprobar.`);
    const actual = s.usuario.residencias[0];
    if (actual) await cerrarResidencia(tx, actual.id, ahora);
    await tx.residencia.create({
      data: {
        usuarioId: s.usuarioId,
        predioId: destino.id,
        relacion: actual?.relacion ?? "OTRO",
        fechaInicio: ahora,
      },
    });
  }
}

/**
 * Resuelve una solicitud (HU-GAR-16 CA3): aprobar aplica el cambio en el padrón (HU-GAR-13 CA3);
 * rechazar exige el motivo. Queda en la auditoría con fecha, responsable y motivo, y el vecino recibe
 * el aviso.
 */
export async function resolverSolicitudArco(
  sesion: SesionDto,
  id: string,
  decision: { aprobar: boolean; motivo?: string },
  ahora = new Date(),
) {
  exigirAdministracion(sesion);
  const s = await solicitudConVecino(id);
  if (!s) throw new ErrorNoEncontrado();
  if (s.tipo !== "RECTIFICACION") throw new ErrorReglaNegocio("Esta solicitud se resuelve sola.");
  const motivo = decision.motivo?.trim() || null;
  if (!decision.aprobar && !motivo)
    throw new ErrorValidacion(undefined, { motivo: "Escriba el motivo: se lo enviaremos al vecino." });
  const estado = decision.aprobar ? "APROBADA" : "RECHAZADA";
  const numero = numeroDeSolicitud(s.numero);
  await prisma.$transaction(async (tx) => {
    if (
      !(await cerrarSolicitud(tx, id, {
        estado,
        resueltaEn: ahora,
        resueltaPor: sesion.usuarioId,
        motivoResolucion: motivo,
      }))
    )
      throw new ErrorConflicto("Esta solicitud ya estaba resuelta.");
    if (decision.aprobar) await aplicarRectificacion(tx, s, ahora);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: decision.aprobar ? "aprobar_arco" : "rechazar_arco",
        entidad: "SolicitudArco",
        entidadId: id,
        antes: { estado: "PENDIENTE", campo: s.campo, valor: s.valorAnterior },
        despues: { estado, valor: decision.aprobar ? s.valorNuevo : s.valorAnterior, motivo },
      },
      tx,
    );
    const resultado = decision.aprobar
      ? `aprobada: ${CAMPOS[s.campo ?? "NOMBRE"].nombre} ya está corregido`
      : `rechazada. Motivo: ${motivo}`;
    await encolarAviso(
      {
        destinatarioId: s.usuarioId,
        titulo: decision.aprobar ? "Corregimos su dato" : "No pudimos corregir su dato",
        texto: `Su solicitud ${numero} fue ${resultado}.`,
        whatsapp: s.usuario.telefonoWhatsApp
          ? {
              telefono: s.usuario.telefonoWhatsApp,
              ...plantillaSolicitudPrivacidad(primerNombre(s.usuario.nombreCompleto), numero, resultado),
            }
          : undefined,
      },
      tx,
    );
  });
  return verSolicitudArco(sesion, id, ahora);
}
