// @HU-GAR-06 @HU-GAR-07 @HU-GAR-08
import { createHash } from "node:crypto";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma, type Transaccion } from "@/compartido/bd/cliente";
import { ErrorConflicto, ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { horaCorta, inicioDelDiaEnLima, primerNombre, rangoHorario } from "@/compartido/fechas";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import {
  plantillaEmergenciaGarita,
  plantillaRejaManual,
  plantillaVisitaEnPuerta,
  plantillaVisitaLlego,
} from "@/compartido/notificaciones/plantillas";
import {
  clasificarBusqueda,
  dniTerminadoEn,
  llegaAHora,
  llevaDemasiado,
  MINUTOS_ANTES,
  MODOS_ACCESO,
  MOTIVOS_EMERGENCIA,
  type MotivoEmergencia,
  SEMAFORO,
} from "@/modulos/identidad/dominio/garita";
import { direccion } from "@/modulos/identidad/dominio/predio";
import { estaEnLaLista, HORAS_DE_PERMISO, normalizarPlaca } from "@/modulos/identidad/dominio/visita";
import {
  anotarAcceso,
  anotarSalida,
  buscarRegistro,
  cambiarEstadoVisita,
  crearVisitaNoAnunciada,
  directivaActiva,
  entradasSinSalida,
  nombreDeUsuario,
  padronParaGarita,
  personaPorDni,
  predioConResidentes,
  prediosPorNombreOCasa,
  prediosPorPlaca,
  registrosEntre,
  salidaDe,
  visitaConPredio,
  visitasParaGarita,
} from "@/modulos/identidad/infraestructura/repositorioGarita";
import { viviendaDe } from "@/modulos/identidad/infraestructura/repositorioVisitas";
import { exigirRol, type SesionDto } from "./sesion";

export { MOTIVOS_EMERGENCIA, SEMAFORO };
export type { MotivoEmergencia };

const exigirGarita = (sesion: SesionDto) => exigirRol(sesion, "VIGILANTE", "ADMINISTRADOR");

type PredioConResidentes = NonNullable<Awaited<ReturnType<typeof predioConResidentes>>>;

const titularDe = (predio: PredioConResidentes) =>
  (predio.residencias.find((r) => r.relacion === "TITULAR") ?? predio.residencias[0])?.usuario;

/** Lo que ve el vigilante de una casa: nombre, vivienda, placas y estado; nunca montos (AC-7). */
function resultado(predio: PredioConResidentes, quien?: string, placa?: string) {
  return {
    predioId: predio.id,
    vivienda: direccion(predio),
    estado: predio.estadoGarita,
    quien: quien ?? titularDe(predio)?.nombreCompleto ?? direccion(predio),
    residentes: predio.residencias.map((r) => r.usuario.nombreCompleto),
    placas: predio.vehiculos.map((v) => v.placa),
    placa: placa ?? null,
  };
}

export type ResultadoConsulta = ReturnType<typeof resultado>;

/**
 * Consulta de la garita por placa, DNI o nombre (HU-GAR-06): devuelve el semáforo de cada casa que
 * coincide. Un DNI de alguien dado de baja dice que ya no está en el padrón.
 */
export async function consultar(sesion: SesionDto, texto: string) {
  exigirGarita(sesion);
  const busqueda = clasificarBusqueda(texto);
  if (!busqueda) throw new ErrorValidacion("Escriba una placa, un DNI o un nombre.");
  if ("placa" in busqueda) {
    const predios = await prediosPorPlaca(busqueda.placa);
    return { resultados: predios.map((p) => resultado(p, undefined, busqueda.placa)), yaNoVive: null };
  }
  if ("dni" in busqueda) {
    const persona = await personaPorDni(busqueda.dni);
    if (!persona) return { resultados: [], yaNoVive: null };
    if (!persona.residencias.length) return { resultados: [], yaNoVive: persona.nombreCompleto };
    return {
      resultados: persona.residencias.map((r) => resultado(r.predio, persona.nombreCompleto)),
      yaNoVive: null,
    };
  }
  const minuscula = busqueda.nombre.toLowerCase();
  const predios = await prediosPorNombreOCasa(busqueda.nombre);
  return {
    resultados: predios.map((p) =>
      resultado(
        p,
        p.residencias.find((r) => r.usuario.nombreCompleto.toLowerCase().includes(minuscula))?.usuario
          .nombreCompleto,
      ),
    ),
    yaNoVive: null,
  };
}

/** Casas para la visita no anunciada (VIG-VIS-03): titular y vivienda. */
export async function buscarCasas(sesion: SesionDto, texto: string) {
  exigirGarita(sesion);
  if (texto.trim().length < 1) return [];
  return (await prediosPorNombreOCasa(texto.trim())).map((p) => ({
    predioId: p.id,
    titular: titularDe(p)?.nombreCompleto ?? "Sin residentes",
    vivienda: direccion(p),
  }));
}

export const hashDeDni = (dni: string) => createHash("sha256").update(dni).digest("hex");

/**
 * La instantánea para consultar sin internet (AC-4, FRONTEND.md §6): placas, nombres y estado de cada
 * casa; los DNI solo como hash SHA-256.
 */
export async function instantanea(sesion: SesionDto, ahora = new Date()) {
  exigirGarita(sesion);
  const predios = await padronParaGarita();
  return {
    generadaEn: ahora.toISOString(),
    casas: predios.map((p) => ({
      ...resultado(p),
      dnis: p.residencias.map((r) => hashDeDni(r.usuario.dni)),
    })),
  };
}

async function casaDeLaGarita(predioId: string) {
  const predio = await predioConResidentes(predioId);
  if (!predio) throw new ErrorNoEncontrado("No encontramos esa casa en el padrón.");
  return predio;
}

/**
 * Anota la entrada de un vecino (HU-GAR-06 y HU-GAR-08 CA1). Si su casa está al día, el vigilante
 * abre la reja; si no, entra abriendo a mano y se le avisa por qué (CA2 y CA3).
 */
export async function anotarEntradaVecino(
  sesion: SesionDto,
  datos: { predioId: string; quien: string; placa?: string | null },
  ahora = new Date(),
) {
  exigirGarita(sesion);
  const predio = await casaDeLaGarita(datos.predioId);
  const modo = predio.estadoGarita === "ROJO" ? "VECINO_A_MANO" : "VECINO_REJA";
  const vivienda = direccion(predio);
  const registro = await prisma.$transaction(async (tx) => {
    const fila = await anotarAcceso(tx, {
      fecha: ahora,
      tipo: "ENTRADA",
      modo,
      quien: datos.quien,
      vivienda,
      placa: datos.placa ? normalizarPlaca(datos.placa) : null,
      predioId: predio.id,
      vigilanteId: sesion.usuarioId,
    });
    if (modo === "VECINO_A_MANO") {
      for (const { usuario } of predio.residencias) {
        await encolarAviso(
          {
            destinatarioId: usuario.id,
            tipo: "SEGURIDAD",
            titulo: "Por ahora la reja no se abre sola",
            texto: `Hoy a las ${horaCorta(ahora)} se entró a su casa abriendo la reja a mano. Cuando se ponga al día con su cuota, vuelve a abrirse sola.`,
            whatsapp: usuario.telefonoWhatsApp
              ? {
                  telefono: usuario.telefonoWhatsApp,
                  ...plantillaRejaManual(primerNombre(usuario.nombreCompleto), horaCorta(ahora), vivienda),
                }
              : undefined,
          },
          tx,
        );
      }
    }
    return fila;
  });
  return aFila(registro, ahora);
}

/**
 * Apertura por emergencia (VIG-CON-04): la salida humana cuando la reja no se abre sola. Queda en la
 * bitácora y en la auditoría, y la directiva recibe el aviso.
 */
export async function abrirPorEmergencia(
  sesion: SesionDto,
  datos: { predioId: string; quien: string; placa?: string | null; motivo: MotivoEmergencia },
  ahora = new Date(),
) {
  exigirGarita(sesion);
  const predio = await casaDeLaGarita(datos.predioId);
  const vivienda = direccion(predio);
  const motivo = MOTIVOS_EMERGENCIA[datos.motivo];
  const directiva = await directivaActiva();
  const registro = await prisma.$transaction(async (tx) => {
    const fila = await anotarAcceso(tx, {
      fecha: ahora,
      tipo: "ENTRADA",
      modo: "EMERGENCIA",
      quien: datos.quien,
      vivienda,
      placa: datos.placa ? normalizarPlaca(datos.placa) : null,
      predioId: predio.id,
      vigilanteId: sesion.usuarioId,
      detalle: motivo,
    });
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "abrir_por_emergencia",
        entidad: "RegistroAcceso",
        entidadId: fila.id,
        antes: null,
        despues: { vivienda, quien: datos.quien, motivo },
      },
      tx,
    );
    for (const persona of directiva) {
      await encolarAviso(
        {
          destinatarioId: persona.id,
          tipo: "SEGURIDAD",
          titulo: "La garita abrió la reja por una emergencia",
          texto: `A las ${horaCorta(ahora)}, para ${datos.quien} (${vivienda}): ${motivo.toLowerCase()}. Quedó en la bitácora.`,
          whatsapp: persona.telefonoWhatsApp
            ? {
                telefono: persona.telefonoWhatsApp,
                ...plantillaEmergenciaGarita(horaCorta(ahora), motivo.toLowerCase(), vivienda),
              }
            : undefined,
        },
        tx,
      );
    }
    return fila;
  });
  return aFila(registro, ahora);
}

// ── Visitas en la garita (HU-GAR-07) ──────────────────────────────────────────

type VisitaGarita = Awaited<ReturnType<typeof visitasParaGarita>>[number];

const vehiculoDe = (v: { conVehiculo: boolean; placa: string | null }) =>
  v.conVehiculo ? (v.placa ? `Auto ${v.placa}` : "En vehículo") : "A pie";

const anunciada = (v: VisitaGarita, ahora: Date) => ({
  id: v.id,
  nombre: v.nombre,
  vivienda: direccion(v.predio),
  cuando: rangoHorario(v.desde, v.hasta),
  vehiculo: vehiculoDe(v),
  llegaAHora: llegaAHora(v, ahora),
});

async function visitasDeHoyEnBd(ahora: Date) {
  const hoy = inicioDelDiaEnLima(ahora);
  return visitasParaGarita(hoy, new Date(hoy.getTime() + 24 * 3_600_000));
}

/**
 * Las visitas de hoy para la tablet (VIG-INI-01, VIG-VIS-01): las anunciadas que siguen en la lista y
 * las no anunciadas que esperan respuesta o que ya la tienen.
 */
export async function visitasDeHoy(sesion: SesionDto, ahora = new Date()) {
  exigirGarita(sesion);
  const visitas = await visitasDeHoyEnBd(ahora);
  return {
    anunciadas: visitas.filter((v) => v.anunciada && estaEnLaLista(v, ahora)).map((v) => anunciada(v, ahora)),
    preguntas: visitas
      .filter(
        (v) => !v.anunciada && ["ESPERANDO_RESPUESTA", "AUTORIZADA", "NO_AUTORIZADA"].includes(v.estado),
      )
      .map((v) => ({ id: v.id, nombre: v.nombre, vivienda: direccion(v.predio), estado: v.estado })),
  };
}

/** Busca en la lista blanca de hoy por nombre o DNI (GET /api/garita/visitas/verificar). */
export async function verificarVisita(sesion: SesionDto, texto: string, ahora = new Date()) {
  exigirGarita(sesion);
  const buscado = texto.trim().toLowerCase();
  if (buscado.length < 2) throw new ErrorValidacion("Escriba el nombre o el DNI de la visita.");
  return (await visitasDeHoyEnBd(ahora))
    .filter((v) => v.anunciada && estaEnLaLista(v, ahora))
    .filter((v) => v.nombre.toLowerCase().includes(buscado) || v.dni === buscado)
    .map((v) => anunciada(v, ahora));
}

async function visitaDeLaGarita(id: string) {
  const visita = await visitaConPredio(id);
  if (!visita) throw new ErrorNoEncontrado("No encontramos esa visita.");
  return visita;
}

/** Ficha de una visita para el vigilante (VIG-VIS-02, VIG-VIS-04, VIG-VIS-05). */
export async function verVisitaEnGarita(sesion: SesionDto, id: string, ahora = new Date()) {
  exigirGarita(sesion);
  const v = await visitaDeLaGarita(id);
  const residentes = v.predio.residencias.map((r) => r.usuario);
  return {
    id: v.id,
    nombre: v.nombre,
    anunciada: v.anunciada,
    estado: v.estado,
    enLaLista: estaEnLaLista(v, ahora),
    llegaAHora: llegaAHora(v, ahora),
    puedePasarDesde: horaCorta(new Date(v.desde.getTime() - MINUTOS_ANTES * 60_000)),
    vivienda: direccion(v.predio),
    cuando: rangoHorario(v.desde, v.hasta),
    vehiculo: vehiculoDe(v),
    motivo: v.motivo,
    anotadaPor: (await nombreDeUsuario(v.registradaPor)) ?? "Un vecino",
    avisadoA: residentes.map((u) => ({
      nombre: u.nombreCompleto,
      telefono: u.telefonoWhatsApp?.replace(/^51(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3") ?? null,
    })),
    avisadoEn: horaCorta(v.creadaEn),
    respondidaPor: v.respondidaPor,
  };
}

/**
 * Llegó una visita anunciada (HU-GAR-07 CA1): pasa, queda en la bitácora y el vecino recibe el aviso.
 */
export async function registrarLlegada(sesion: SesionDto, id: string, ahora = new Date()) {
  exigirGarita(sesion);
  const v = await visitaDeLaGarita(id);
  if (!v.anunciada || !estaEnLaLista(v, ahora))
    throw new ErrorConflicto("Esta visita ya no está en la lista. Pregunte al vecino si la deja pasar.");
  if (!llegaAHora(v, ahora)) {
    const desde = horaCorta(new Date(v.desde.getTime() - MINUTOS_ANTES * 60_000));
    throw new ErrorReglaNegocio(`La visita está anunciada para más tarde. Puede pasar desde las ${desde}.`);
  }
  const anfitrion = await prisma.usuario.findUnique({ where: { id: v.registradaPor } });
  const registro = await prisma.$transaction(async (tx) => {
    if (!(await cambiarEstadoVisita(tx, id, ["PROGRAMADA"], { estado: "LLEGO", llegoEn: ahora })))
      throw new ErrorConflicto("Esta visita ya se anotó.");
    const fila = await entradaDeVisita(
      tx,
      sesion,
      v,
      `Visita anunciada por ${anfitrion?.nombreCompleto ?? "el vecino"}`,
      ahora,
    );
    if (anfitrion) {
      await encolarAviso(
        {
          destinatarioId: anfitrion.id,
          tipo: "GARITA",
          titulo: `${v.nombre} llegó`,
          texto: `Su visita entró a las ${horaCorta(ahora)}.`,
          whatsapp: anfitrion.telefonoWhatsApp
            ? {
                telefono: anfitrion.telefonoWhatsApp,
                ...plantillaVisitaLlego(primerNombre(anfitrion.nombreCompleto), v.nombre, horaCorta(ahora)),
              }
            : undefined,
        },
        tx,
      );
    }
    return fila;
  });
  return aFila(registro, ahora);
}

function entradaDeVisita(
  tx: Transaccion,
  sesion: SesionDto,
  v: {
    id: string;
    nombre: string;
    placa: string | null;
    predioId: string;
    predio: { manzana: string; lote: string };
  },
  detalle: string,
  ahora: Date,
) {
  return anotarAcceso(tx, {
    fecha: ahora,
    tipo: "ENTRADA",
    modo: "VISITA",
    quien: v.nombre,
    vivienda: direccion(v.predio),
    placa: v.placa,
    predioId: v.predioId,
    visitaId: v.id,
    vigilanteId: sesion.usuarioId,
    detalle,
  });
}

/**
 * Visita no anunciada (HU-GAR-07 CA2): el vigilante la anota y se le pregunta a la casa por la app y
 * por WhatsApp. Responde en `/visitas/{id}/responder` o por teléfono.
 */
export async function preguntarAlVecino(
  sesion: SesionDto,
  datos: {
    nombre: string;
    dni?: string;
    predioId: string;
    motivo: string;
    conVehiculo: boolean;
    placa?: string;
  },
  origen: string,
  ahora = new Date(),
) {
  exigirGarita(sesion);
  const predio = await casaDeLaGarita(datos.predioId);
  if (!predio.residencias.length) throw new ErrorReglaNegocio("En esa casa no vive nadie del padrón.");
  return prisma.$transaction(async (tx) => {
    const visita = await crearVisitaNoAnunciada(tx, {
      predioId: predio.id,
      registradaPor: sesion.usuarioId,
      nombre: datos.nombre.trim(),
      dni: datos.dni || null,
      motivo: datos.motivo.trim(),
      desde: ahora,
      hasta: new Date(ahora.getTime() + HORAS_DE_PERMISO * 3_600_000),
      conVehiculo: datos.conVehiculo,
      placa: datos.conVehiculo && datos.placa ? normalizarPlaca(datos.placa) : null,
    });
    const enlace = `${origen}/visitas/${visita.id}/responder`;
    for (const { usuario } of predio.residencias) {
      await encolarAviso(
        {
          destinatarioId: usuario.id,
          tipo: "GARITA",
          titulo: `${visita.nombre} está en la garita`,
          texto: `Pregunta por usted: ${visita.motivo}. Responda si la deja pasar o llame a la garita.`,
          whatsapp: usuario.telefonoWhatsApp
            ? {
                telefono: usuario.telefonoWhatsApp,
                ...plantillaVisitaEnPuerta(primerNombre(usuario.nombreCompleto), visita.nombre, enlace),
              }
            : undefined,
        },
        tx,
      );
    }
    return { id: visita.id };
  });
}

/** Lo que ve el vecino al responder (VEC-GAR-05): solo si la visita es para su casa (AC-7). */
export async function visitaPorResponder(sesion: SesionDto, id: string) {
  const predio = await viviendaDe(sesion.usuarioId);
  const v = await visitaConPredio(id);
  if (!predio || !v || v.predioId !== predio.id || v.anunciada) throw new ErrorNoEncontrado();
  return {
    id: v.id,
    nombre: v.nombre,
    dni: dniTerminadoEn(v.dni),
    motivo: v.motivo,
    vehiculo: vehiculoDe(v),
    llegoA: horaCorta(v.creadaEn),
    anotadaPor: (await nombreDeUsuario(v.registradaPor)) ?? "El vigilante",
    estado: v.estado,
  };
}

async function guardarRespuesta(id: string, autoriza: boolean, via: string, ahora: Date) {
  const cambio = await prisma.$transaction((tx) =>
    cambiarEstadoVisita(tx, id, ["ESPERANDO_RESPUESTA"], {
      estado: autoriza ? "AUTORIZADA" : "NO_AUTORIZADA",
      respondidaEn: ahora,
      respondidaPor: via,
    }),
  );
  if (!cambio) throw new ErrorConflicto("Esta visita ya tiene respuesta.");
}

/** El vecino responde desde la app si deja pasar a la visita (HU-GAR-07 CA3). */
export async function responderVisita(sesion: SesionDto, id: string, autoriza: boolean, ahora = new Date()) {
  await visitaPorResponder(sesion, id);
  await guardarRespuesta(id, autoriza, `${sesion.nombreCompleto}, desde la app`, ahora);
}

/** El vecino respondió por teléfono y el vigilante lo marca (VIG-VIS-04). */
export async function marcarRespuestaTelefono(
  sesion: SesionDto,
  id: string,
  autoriza: boolean,
  ahora = new Date(),
) {
  exigirGarita(sesion);
  const v = await visitaDeLaGarita(id);
  if (v.anunciada) throw new ErrorConflicto("Esta visita estaba anunciada: no hace falta preguntar.");
  await guardarRespuesta(id, autoriza, "por teléfono, a la garita", ahora);
}

/** La casa autorizó: el vigilante anota la entrada (HU-GAR-07 CA3, HU-GAR-08 CA1). */
export async function anotarEntradaVisita(sesion: SesionDto, id: string, ahora = new Date()) {
  exigirGarita(sesion);
  const v = await visitaDeLaGarita(id);
  const registro = await prisma.$transaction(async (tx) => {
    if (!(await cambiarEstadoVisita(tx, id, ["AUTORIZADA"], { estado: "LLEGO", llegoEn: ahora })))
      throw new ErrorConflicto("La casa todavía no autorizó esta visita.");
    return entradaDeVisita(
      tx,
      sesion,
      v,
      `Visita no anunciada · autorizó ${v.respondidaPor ?? "la casa"}`,
      ahora,
    );
  });
  return aFila(registro, ahora);
}

/** La visita no entró: no la autorizaron o se fue antes de la respuesta. También queda anotado. */
export async function anotarNoEntro(sesion: SesionDto, id: string, ahora = new Date()) {
  exigirGarita(sesion);
  const v = await visitaDeLaGarita(id);
  const registro = await prisma.$transaction(async (tx) => {
    if (
      !(await cambiarEstadoVisita(tx, id, ["ESPERANDO_RESPUESTA", "NO_AUTORIZADA"], { estado: "NO_ENTRO" }))
    )
      throw new ErrorConflicto("Esta visita ya se anotó.");
    return anotarAcceso(tx, {
      fecha: ahora,
      tipo: "ENTRADA",
      modo: "NO_ENTRO",
      quien: v.nombre,
      vivienda: direccion(v.predio),
      placa: v.placa,
      predioId: v.predioId,
      visitaId: v.id,
      vigilanteId: sesion.usuarioId,
      detalle: v.estado === "NO_AUTORIZADA" ? "La casa no la autorizó" : "Se fue antes de la respuesta",
    });
  });
  return aFila(registro, ahora);
}

// ── Bitácora (HU-GAR-08) ───────────────────────────────────────────────────────

type Registro = Awaited<ReturnType<typeof registrosEntre>>[number];

function aFila(r: Registro, ahora: Date, salidaEn?: Date) {
  const esVecino = r.modo === "VECINO_REJA" || r.modo === "VECINO_A_MANO";
  return {
    id: r.id,
    tipo: r.tipo,
    modo: r.modo,
    hora: horaCorta(r.fecha),
    fecha: r.fecha.toISOString(),
    quien: r.quien,
    placa: r.placa,
    vivienda: r.vivienda,
    descripcion: r.detalle ? `${MODOS_ACCESO[r.modo]} · ${r.detalle}` : MODOS_ACCESO[r.modo],
    salida: salidaEn ? horaCorta(salidaEn) : null,
    /** Un vehículo de fuera que lleva más de 6 horas dentro (HU-GAR-08 CA2). */
    alerta:
      r.tipo === "ENTRADA" &&
      !salidaEn &&
      r.modo !== "NO_ENTRO" &&
      !esVecino &&
      llevaDemasiado(r.fecha, ahora),
  };
}

export type FilaBitacora = ReturnType<typeof aFila>;

/**
 * La bitácora de hoy (VIG-BIT-01): cada entrada con su salida si la hubo, quién sigue dentro y las
 * alertas de permanencia (CA2). Se consulta desde las 0:00 de Lima y lo que siga dentro de días antes.
 */
export async function bitacora(sesion: SesionDto, ahora = new Date()) {
  exigirGarita(sesion);
  const hoy = inicioDelDiaEnLima(ahora);
  const desdeAyer = new Date(hoy.getTime() - 24 * 3_600_000);
  const [registros, dentro] = await Promise.all([
    registrosEntre(hoy, ahora),
    entradasSinSalida(desdeAyer, ahora),
  ]);
  const salidas = new Map(
    registros.filter((r) => r.tipo === "SALIDA" && r.entradaId).map((r) => [r.entradaId as string, r.fecha]),
  );
  const entradas = registros.filter((r) => r.tipo === "ENTRADA");
  const deAyer = dentro.filter((r) => r.fecha < hoy);
  return {
    filas: [...entradas, ...deAyer].map((r) => aFila(r, ahora, salidas.get(r.id))),
    dentro: dentro.map((r) => aFila(r, ahora)),
  };
}

/** Marca la salida de quien entró (HU-GAR-08 CA2): una fila nueva, nunca un cambio a la entrada (CA3). */
export async function marcarSalida(sesion: SesionDto, entradaId: string, ahora = new Date()) {
  exigirGarita(sesion);
  const entrada = await buscarRegistro(entradaId);
  if (!entrada || entrada.tipo !== "ENTRADA" || entrada.modo === "NO_ENTRO")
    throw new ErrorNoEncontrado("No encontramos esa entrada en la bitácora.");
  const salida =
    (await salidaDe(entradaId)) ??
    (await anotarSalida(
      {
        entradaId,
        modo: entrada.modo,
        quien: entrada.quien,
        vivienda: entrada.vivienda,
        placa: entrada.placa,
        vigilanteId: sesion.usuarioId,
      },
      ahora,
    ));
  if (!salida) throw new ErrorConflicto("Esta salida ya estaba anotada.");
  return aFila(entrada, ahora, salida.fecha);
}
