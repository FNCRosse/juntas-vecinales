// @HU-COB-16
import { prisma } from "@/compartido/bd/cliente";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { soles } from "@/compartido/dinero";
import { ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { fechaCorta, fechaEnFrase, fechaLarga } from "@/compartido/fechas";
import { encolarAvisos } from "@/compartido/notificaciones/encolar";
import { casasQuePaganPor } from "@/modulos/identidad/aplicacion/comunidad";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  aplicarCambio,
  type Concepto,
  type DatosCambio,
  diaEnLima,
  opcionesDeVigencia,
  prepararCambio,
  separarVersiones,
  textoDelCambio,
  UNIDAD_EN_TEXTO,
} from "@/modulos/aportes/dominio/tarifa";
import {
  crearVersionDeTarifa,
  tarifaPorIdOperacion,
  type VersionDeTarifa,
  versionesDeTarifa,
} from "@/modulos/aportes/infraestructura/repositorioTarifa";

const LEEN = ["DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

/** Los conceptos de una versión como datos puros (sin los ids de la fila). */
const conceptosDe = (v?: Pick<VersionDeTarifa, "conceptos"> | null): Concepto[] =>
  (v?.conceptos ?? []).map(({ clave, nombre, unidad, monto }) => ({ clave, nombre, unidad, monto }));

const conceptoDto = (c: Concepto) => ({ ...c, unidadTexto: UNIDAD_EN_TEXTO[c.unidad] });

/** «Acta de asamblea del 28 de marzo de 2026» se lee «aprobada en el acta de asamblea…»; otro texto, tal cual. */
const aprobadaEn = (acta: string) =>
  /^acta\b/i.test(acta) ? `el ${acta.charAt(0).toLowerCase()}${acta.slice(1)}` : acta;

function entradaDeHistorial(v: VersionDeTarifa, ahora: Date) {
  const programada = v.vigenciaDesde > ahora;
  return {
    id: v.id,
    texto: textoDelCambio({
      tipo: v.tipoCambio as "AGREGAR" | "CAMBIAR",
      nombre: v.cambioNombre ?? "",
      unidad: v.cambioUnidad!,
      montoAnterior: v.montoAnterior,
      montoNuevo: v.montoNuevo ?? 0,
    }),
    rige: `Rige desde ${fechaEnFrase(v.vigenciaDesde)}${programada ? ` · programado el ${fechaCorta(v.creadaEn)}` : ""}`,
    responsable: v.autor,
    acta: v.acta,
    programada,
  };
}

/**
 * La tarifa para la directiva y el mediador (DIR-COB-20 y DIR-COB-21): la vigente, los cambios programados y el
 * historial de solo lectura (HU-COB-16 CA1 y CA3). Solo la directiva puede cambiarla; el mediador la ve.
 * `conceptos` es la lista con la que se compara un cambio nuevo (la de la última versión), con las casas que pagan
 * por cada uno.
 */
export async function verTarifa(sesion: SesionDto, ahora = new Date()) {
  exigirRol(sesion, ...LEEN);
  const versiones = await versionesDeTarifa();
  const { vigente, programadas } = separarVersiones(versiones, ahora);
  const ultima = [...versiones]
    .sort(
      (a, b) =>
        a.vigenciaDesde.getTime() - b.vigenciaDesde.getTime() || a.creadaEn.getTime() - b.creadaEn.getTime(),
    )
    .at(-1);
  const base = conceptosDe(ultima);
  const casas = await Promise.all(
    base.map(async (c) => [c.clave, (await casasQuePaganPor(c.clave)).casas] as const),
  );
  const historial = [...versiones]
    .filter((v) => v.tipoCambio !== "INICIAL")
    .sort(
      (a, b) =>
        b.vigenciaDesde.getTime() - a.vigenciaDesde.getTime() || b.creadaEn.getTime() - a.creadaEn.getTime(),
    )
    .map((v) => entradaDeHistorial(v, ahora));
  return {
    puedeCambiar: sesion.roles.includes("DIRECTIVA"),
    vigente: vigente
      ? {
          desde: fechaEnFrase(vigente.vigenciaDesde),
          aprobadaEn: aprobadaEn(vigente.acta),
          conceptos: conceptosDe(vigente).map(conceptoDto),
        }
      : null,
    programados: programadas
      .filter((v) => v.tipoCambio !== "INICIAL")
      .map((v) => ({ ...entradaDeHistorial(v, ahora), desde: fechaEnFrase(v.vigenciaDesde) })),
    historial,
    conceptos: base.map((c) => ({ ...conceptoDto(c), casas: Object.fromEntries(casas)[c.clave] ?? 0 })),
    opciones: opcionesDeVigencia(ahora, ultima ? diaEnLima(ultima.vigenciaDesde) : null).map((dia, i) => ({
      dia,
      texto: fechaLarga(new Date(`${dia}T17:00:00Z`)),
      esProximo: i === 0,
    })),
  };
}

export type TarifaDto = Awaited<ReturnType<typeof verTarifa>>;

/**
 * Programa un cambio de tarifa aprobado en asamblea (HU-COB-16 CA1 y CA2): solo la directiva, con su acta, desde
 * el siguiente ciclo en adelante. Crea una versión nueva —las cuotas ya emitidas no cambian— y avisa el monto nuevo
 * a las casas que pagan por ese concepto antes de que rija; todo en una transacción con su auditoría (AC-6). Repetir
 * el mismo `idOperacion` devuelve lo programado sin avisar otra vez (AC-5).
 */
export async function cambiarTarifa(
  sesion: SesionDto,
  datos: DatosCambio & { idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA");
  const previa = await tarifaPorIdOperacion(datos.idOperacion);
  if (previa) {
    // Otra persona no puede ver ni reusar un cambio ajeno con ese identificador (AC-7).
    if (previa.autorId !== sesion.usuarioId) throw new ErrorNoEncontrado();
    return { cambio: entradaDeHistorial(previa, ahora), avisadas: 0, creado: false };
  }

  const versiones = await versionesDeTarifa();
  const ultima = versiones.at(-1);
  const base = conceptosDe(ultima);
  const { errores, cambio } = prepararCambio(
    datos,
    base,
    ahora,
    ultima ? diaEnLima(ultima.vigenciaDesde) : null,
  );
  if (!cambio) throw new ErrorValidacion(undefined, errores);

  const { casas, residentes } = await casasQuePaganPor(cambio.concepto.clave);
  const creada = await prisma.$transaction(async (tx) => {
    const fila = await crearVersionDeTarifa(tx, {
      idOperacion: datos.idOperacion,
      vigenciaDesde: cambio.vigenciaDesde,
      acta: cambio.acta,
      tipoCambio: cambio.tipo,
      cambioClave: cambio.concepto.clave,
      cambioNombre: cambio.concepto.nombre,
      cambioUnidad: cambio.concepto.unidad,
      montoAnterior: cambio.montoAnterior,
      montoNuevo: cambio.concepto.monto,
      autorId: sesion.usuarioId,
      autor: sesion.nombreCompleto,
      creadaEn: ahora,
      conceptos: aplicarCambio(base, cambio),
    });
    await encolarAvisos(
      residentes.map((destinatarioId) => ({
        destinatarioId,
        tipo: "PAGOS" as const,
        titulo: `Cambia la cuota de «${cambio.concepto.nombre}»`,
        texto: `Desde ${fechaEnFrase(cambio.vigenciaDesde)} pasa de ${soles(cambio.montoAnterior ?? 0)} a ${soles(cambio.concepto.monto)} por semana. Las cuotas ya emitidas no cambian.`,
      })),
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "cambiar_tarifa",
        entidad: "Tarifa",
        entidadId: fila.id,
        antes:
          cambio.montoAnterior === null
            ? null
            : { concepto: cambio.concepto.nombre, monto: soles(cambio.montoAnterior) },
        despues: {
          concepto: cambio.concepto.nombre,
          monto: soles(cambio.concepto.monto),
          vigencia: cambio.vigencia,
          acta: cambio.acta,
          casas,
        },
      },
      tx,
    );
    return fila;
  });
  return { cambio: entradaDeHistorial(creada, ahora), avisadas: casas, creado: true };
}
