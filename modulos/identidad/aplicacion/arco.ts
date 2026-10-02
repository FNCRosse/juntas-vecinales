// @HU-GAR-12 @HU-GAR-13 @HU-GAR-14 @HU-GAR-15 @HU-GAR-16 @HU-GAR-17
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import type { SeccionPdf } from "@/compartido/archivos/pdf";
import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import { ErrorConflicto, ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { fechaLarga, fechaYHora, primerNombre } from "@/compartido/fechas";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import {
  plantillaCancelacionPedida,
  plantillaNumeroCambiado,
  plantillaSolicitudPrivacidad,
} from "@/compartido/notificaciones/plantillas";
import {
  CAMPOS,
  type CampoRectificable,
  celularLegible,
  dniAnonimo,
  EFECTO_CANCELACION,
  errorDeRectificacion,
  estadoDelPlazo,
  fechaLimite,
  leerCelular,
  leerVivienda,
  MOTIVOS_CANCELACION,
  type MotivoCancelacion,
  NOMBRE_ANONIMO,
  numeroDeSolicitud,
  type Oposicion,
  TIPOS_ARCO,
  type TipoArco,
  type Verificacion,
  VERIFICACIONES,
} from "@/modulos/identidad/dominio/arco";
import { NOMBRE_RELACION } from "@/modulos/identidad/dominio/empadronamiento";
import { direccion } from "@/modulos/identidad/dominio/predio";
import {
  administradoresActivos,
  anonimizarIdentidad,
  cancelacionPendiente,
  cerrarSolicitud,
  contarPendientes,
  crearSolicitud,
  nombreDeUsuario,
  pendienteDelMismoCampo,
  solicitudConVecino,
  solicitudesDelVecino,
  solicitudesParaLaBandeja,
  ultimaOposicion,
} from "@/modulos/identidad/infraestructura/repositorioArco";
import { buscarPredioPorLote, cerrarResidencia } from "@/modulos/identidad/infraestructura/repositorioPadron";
import { exigirRol, type SesionDto } from "./sesion";

export { CAMPOS, EFECTO_CANCELACION, MOTIVOS_CANCELACION, TIPOS_ARCO, VERIFICACIONES };
export type { CampoRectificable, MotivoCancelacion, TipoArco, Verificacion };

type Solicitud = NonNullable<Awaited<ReturnType<typeof solicitudConVecino>>>;

function titulo(s: { tipo: TipoArco; campo: CampoRectificable | null; valorNuevo: string | null }) {
  if (s.campo === "WHATSAPP") return "Cambiar su número de WhatsApp";
  if (s.tipo === "OPOSICION" && s.valorNuevo === "RETIRADA") return "Volver a mostrar su ubicación exacta";
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
  const [solicitudes, oculta] = await Promise.all([
    solicitudesDelVecino(sesion.usuarioId),
    prefiereUbicacionGeneralizada(sesion.usuarioId),
  ]);
  return {
    ocultaUbicacion: oculta,
    cancelacionPendiente: solicitudes.some((s) => s.tipo === "CANCELACION" && s.estado === "PENDIENTE"),
    nombre: usuario.nombreCompleto,
    dni: terminaEn(usuario.dni, 2),
    vivienda: residencia ? direccion(residencia.predio) : "Sin vivienda en el padrón",
    whatsapp: terminaEn(usuario.telefonoWhatsApp, 3),
    solicitudes: solicitudes.map((s) => ({
      id: s.id,
      numero: numeroDeSolicitud(s.numero),
      titulo: titulo(s),
      estado: s.estado,
      estadoTexto: {
        PENDIENTE: s.campo === "WHATSAPP" ? "Pendiente de verificación" : "Pendiente de revisión",
        APROBADA: "Aprobada",
        RECHAZADA: "Rechazada",
        RESUELTA_SOLA: "Lista",
      }[s.estado],
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
 * Pide corregir su nombre, su DNI o su vivienda (HU-GAR-13 CA1), o cambiar su número (HU-GAR-17
 * CA1). Queda pendiente hasta que el administrador la resuelva (HU-GAR-13 CA2).
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
    WHATSAPP: usuario.telefonoWhatsApp ?? "",
  }[datos.campo];
  if (datos.campo === "DIRECCION" && !residencia)
    throw new ErrorReglaNegocio("No tiene vivienda en el padrón. Pida ayuda a la administración.");
  const vivienda = datos.campo === "DIRECCION" ? leerVivienda(datos.valor) : null;
  const nuevo = vivienda
    ? direccion(vivienda)
    : datos.campo === "WHATSAPP"
      ? (leerCelular(datos.valor) ?? datos.valor.trim())
      : datos.valor.trim();
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

/**
 * Pide cancelar su cuenta y sus datos (HU-GAR-14 CA1). Su cuenta sigue igual mientras se revisa; la
 * administración recibe el aviso con el plazo legal (CA2).
 */
export async function solicitarCancelacion(
  sesion: SesionDto,
  datos: { motivo: MotivoCancelacion; detalle?: string },
  ahora = new Date(),
) {
  if (await cancelacionPendiente(sesion.usuarioId))
    throw new ErrorConflicto("Ya pidió cancelar su cuenta. Espere la respuesta de la administración.");
  const usuario = await cargarUsuario(sesion.usuarioId);
  const residencia = usuario.residencias[0];
  const quien = residencia
    ? `${usuario.nombreCompleto} (${direccion(residencia.predio)})`
    : usuario.nombreCompleto;
  const vence = fechaLarga(fechaLimite(ahora, "CANCELACION"));
  const administradores = await administradoresActivos();
  const solicitud = await prisma.$transaction(async (tx) => {
    const creada = await crearSolicitud(tx, {
      usuarioId: sesion.usuarioId,
      tipo: "CANCELACION",
      detalle: [MOTIVOS_CANCELACION[datos.motivo], datos.detalle?.trim()].filter(Boolean).join(": "),
      creadaEn: ahora,
    });
    for (const admin of administradores) {
      await encolarAviso(
        {
          destinatarioId: admin.id,
          titulo: `Pedido de cancelación ${numeroDeSolicitud(creada.numero)}`,
          texto: `${quien} pidió cancelar su cuenta. Resuélvalo antes del ${vence}.`,
          whatsapp: admin.telefonoWhatsApp
            ? { telefono: admin.telefonoWhatsApp, ...plantillaCancelacionPedida(quien, vence) }
            : undefined,
        },
        tx,
      );
    }
    return creada;
  });
  return { id: solicitud.id, numero: numeroDeSolicitud(solicitud.numero), vence };
}

/** Si la persona se opuso a que el mapa muestre su ubicación exacta: lo consulta M3 (HU-GAR-15). */
export async function prefiereUbicacionGeneralizada(usuarioId: string) {
  return (await ultimaOposicion(usuarioId))?.valorNuevo === "ACTIVA";
}

/**
 * Activa o retira la oposición (HU-GAR-15 CA1): se aplica sola y de inmediato, también a sus reportes
 * anteriores (CA3), porque el mapa la consulta al construirse. Cada cambio queda como solicitud
 * resuelta sola y en la auditoría.
 */
export async function cambiarOposicion(sesion: SesionDto, activa: boolean, ahora = new Date()) {
  const antes: Oposicion = (await prefiereUbicacionGeneralizada(sesion.usuarioId)) ? "ACTIVA" : "RETIRADA";
  const despues: Oposicion = activa ? "ACTIVA" : "RETIRADA";
  if (antes === despues) return { ocultaUbicacion: activa };
  await prisma.$transaction(async (tx) => {
    const creada = await crearSolicitud(tx, {
      usuarioId: sesion.usuarioId,
      tipo: "OPOSICION",
      estado: "RESUELTA_SOLA",
      valorAnterior: antes,
      valorNuevo: despues,
      creadaEn: ahora,
      resueltaEn: ahora,
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: activa ? "oponerse_ubicacion_exacta" : "retirar_oposicion_ubicacion",
        entidad: "SolicitudArco",
        entidadId: creada.id,
        antes: { oposicion: antes },
        despues: { oposicion: despues },
      },
      tx,
    );
  });
  return { ocultaUbicacion: activa };
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
          : s.valorNuevo === "RETIRADA"
            ? "Se aplicó sola: sus reportes vuelven a mostrarse en el punto exacto."
            : "Se aplicó sola, también a sus reportes anteriores: se muestran solo por manzana."
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
    antes: s.campo === "WHATSAPP" ? (celularLegible(s.valorAnterior) ?? "Sin número") : s.valorAnterior,
    nuevo: s.campo === "WHATSAPP" ? celularLegible(s.valorNuevo) : s.valorNuevo,
    /** El cambio de número exige decir cómo se verificó la identidad (HU-GAR-17 CA2). */
    pideVerificacion: s.campo === "WHATSAPP",
    verificacion: s.verificacion,
    detalle: s.detalle,
    vence: fechaLarga(fechaLimite(s.creadaEn, s.tipo)),
    motivoResolucion: s.motivoResolucion,
    /** Qué se borra y qué se conserva si se aprueba una cancelación (ADM-ARC-04). */
    efecto: s.tipo === "CANCELACION" ? EFECTO_CANCELACION : null,
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
  } else if (s.campo === "WHATSAPP") {
    await tx.usuario.update({ where: { id: s.usuarioId }, data: { telefonoWhatsApp: valor } });
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

/** Lo que otro módulo borra de la persona al aprobar su cancelación, en la misma transacción. */
export type AnonimizarEnOtroModulo = (usuarioId: string, tx: Transaccion) => Promise<void>;

/**
 * Resuelve una solicitud (HU-GAR-16 CA3): aprobar aplica la corrección en el padrón (HU-GAR-13 CA3)
 * o anonimiza a la persona (HU-GAR-14 CA3, con lo que `app/` pase de los demás módulos); rechazar
 * exige el motivo. Queda en la auditoría con fecha, responsable y motivo, y el vecino recibe el aviso.
 */
export async function resolverSolicitudArco(
  sesion: SesionDto,
  id: string,
  decision: { aprobar: boolean; motivo?: string; verificacion?: Verificacion },
  ahora = new Date(),
  otrosModulos: AnonimizarEnOtroModulo[] = [],
) {
  exigirAdministracion(sesion);
  const s = await solicitudConVecino(id);
  if (!s) throw new ErrorNoEncontrado();
  if (s.tipo !== "RECTIFICACION" && s.tipo !== "CANCELACION")
    throw new ErrorReglaNegocio("Esta solicitud se resuelve sola.");
  const cancela = decision.aprobar && s.tipo === "CANCELACION";
  const motivo = decision.motivo?.trim() || null;
  if (!decision.aprobar && !motivo)
    throw new ErrorValidacion(undefined, { motivo: "Escriba el motivo: se lo enviaremos al vecino." });
  const esNumero = s.campo === "WHATSAPP";
  if (decision.aprobar && esNumero && !decision.verificacion)
    throw new ErrorValidacion(undefined, {
      verificacion: "Indique cómo se verificó su identidad antes de cambiar el número.",
    });
  const verificacion =
    decision.aprobar && decision.verificacion ? VERIFICACIONES[decision.verificacion] : null;
  const estado = decision.aprobar ? "APROBADA" : "RECHAZADA";
  await prisma.$transaction(async (tx) => {
    if (
      !(await cerrarSolicitud(tx, id, {
        estado,
        resueltaEn: ahora,
        resueltaPor: sesion.usuarioId,
        motivoResolucion: motivo,
        verificacion,
      }))
    )
      throw new ErrorConflicto("Esta solicitud ya estaba resuelta.");
    if (cancela) {
      await anonimizarIdentidad(
        tx,
        s.usuarioId,
        { nombre: NOMBRE_ANONIMO, dni: dniAnonimo(s.usuarioId) },
        ahora,
      );
      for (const anonimizar of otrosModulos) await anonimizar(s.usuarioId, tx);
    } else if (decision.aprobar) await aplicarRectificacion(tx, s, ahora);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: decision.aprobar ? "aprobar_arco" : "rechazar_arco",
        entidad: "SolicitudArco",
        entidadId: id,
        antes: { estado: "PENDIENTE", campo: s.campo, valor: s.valorAnterior },
        despues: { estado, valor: decision.aprobar ? s.valorNuevo : s.valorAnterior, motivo, verificacion },
      },
      tx,
    );
    if (decision.aprobar && esNumero) await avisarCambioDeNumero(tx, s);
    else await avisarResultado(tx, s, decision.aprobar, motivo, cancela);
  });
  return verSolicitudArco(sesion, id, ahora);
}

/** El cambio de número por su propia ruta (`PATCH /api/admin/contacto/{id}`): solo solicitudes de número. */
export async function resolverCambioDeNumero(
  sesion: SesionDto,
  id: string,
  decision: { aprobar: boolean; motivo?: string; verificacion?: Verificacion },
  ahora = new Date(),
) {
  exigirAdministracion(sesion);
  const s = await solicitudConVecino(id);
  if (!s || s.campo !== "WHATSAPP") throw new ErrorNoEncontrado();
  return resolverSolicitudArco(sesion, id, decision, ahora);
}

/**
 * El resultado al vecino. Si se canceló su cuenta, ya no tiene centro de avisos: solo el WhatsApp a
 * su número de antes, que el worker borra de la cola al enviarlo.
 */
async function avisarResultado(
  tx: Transaccion,
  s: Solicitud,
  aprobada: boolean,
  motivo: string | null,
  cancelada = false,
) {
  const numero = numeroDeSolicitud(s.numero);
  const resultado = cancelada
    ? "aprobada: borramos sus datos personales y su cuenta quedó cerrada"
    : aprobada
      ? `aprobada: ${CAMPOS[s.campo ?? "NOMBRE"].nombre} ya está corregido`
      : `rechazada. Motivo: ${motivo}`;
  await encolarAviso(
    {
      destinatarioId: s.usuarioId,
      conCopiaInterna: !cancelada,
      titulo:
        s.tipo === "CANCELACION"
          ? aprobada
            ? "Cancelamos su cuenta"
            : "No cancelamos su cuenta"
          : aprobada
            ? "Corregimos su dato"
            : "No pudimos corregir su dato",
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
}

/**
 * El número cambió (HU-GAR-17 CA3): la confirmación llega al número nuevo y también al anterior, por
 * si no lo pidió la persona. Es de seguridad: sale siempre. Una sola copia en el centro de avisos.
 */
async function avisarCambioDeNumero(tx: Transaccion, s: Solicitud) {
  const nombre = primerNombre(s.usuario.nombreCompleto);
  const nuevo = s.valorNuevo ?? "";
  const plantilla = plantillaNumeroCambiado(nombre, nuevo.slice(-3));
  await encolarAviso(
    {
      destinatarioId: s.usuarioId,
      tipo: "SEGURIDAD",
      titulo: "Cambiamos su número de WhatsApp",
      texto: `Desde ahora sus avisos llegan al ${celularLegible(nuevo)}. También avisamos a su número anterior.`,
      whatsapp: { telefono: nuevo, ...plantilla },
    },
    tx,
  );
  if (s.valorAnterior) {
    await encolarAviso(
      {
        destinatarioId: s.usuarioId,
        tipo: "SEGURIDAD",
        titulo: "Cambiamos su número de WhatsApp",
        texto: "Aviso al número anterior.",
        whatsapp: { telefono: s.valorAnterior, ...plantilla },
        conCopiaInterna: false,
      },
      tx,
    );
  }
}
