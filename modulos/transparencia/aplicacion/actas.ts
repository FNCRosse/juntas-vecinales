// @HU-ASA-11
import { prisma } from "@/compartido/bd/cliente";
import { generarPdf } from "@/compartido/archivos/pdf";
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { fechaLarga, fechaYHora } from "@/compartido/fechas";
import { exigirRol, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { type DatosActa, nombreDeArchivo, prepararActa } from "@/modulos/transparencia/dominio/acta";
import {
  buscarActa,
  buscarActaPorIdOperacion,
  crearActa,
  listarActas,
} from "@/modulos/transparencia/infraestructura/repositorioPublicaciones";
import { avisarALaComunidad } from "./avisarComunidad";

const ROLES_VECINO = ["VECINO", "VECINO_ADULTO_MAYOR", "DIRECTIVA", "DIRECTIVO_MEDIADOR"] as const;

type Fila = NonNullable<Awaited<ReturnType<typeof buscarActa>>>;

const aDto = (p: Fila) => ({
  id: p.id,
  titulo: p.titulo,
  fechaAsamblea: fechaLarga(p.acta!.fechaAsamblea),
  acuerdos: p.acta!.acuerdos,
  compromisos: p.acta!.compromisos,
  conclusiones: p.acta!.conclusiones,
  autor: p.autor,
  fecha: p.fechaPublicacion.toISOString(),
});

export type ActaDto = ReturnType<typeof aDto>;

type ActaPreparada = ReturnType<typeof prepararActa>["acta"];

function pdfDelActa(acta: ActaPreparada, publicada: { autor: string; fecha: Date } | null) {
  return generarPdf({
    titulo: `Acta de asamblea: ${acta.titulo}`,
    subtitulos: [
      "Junta Vecinal de Villa de Fátima",
      `Asamblea del ${fechaLarga(acta.fechaAsamblea).toLowerCase()}`,
      publicada
        ? `Publicada el ${fechaYHora(publicada.fecha)} por ${publicada.autor}`
        : "Vista previa: el acta todavía no está publicada.",
    ],
    secciones: [
      { titulo: "Acuerdos", parrafos: acta.acuerdos.map((a, i) => `${i + 1}. ${a}`) },
      {
        titulo: "Compromisos",
        parrafos: acta.compromisos.length ? acta.compromisos.map((c, i) => `${i + 1}. ${c}`) : ["Ninguno."],
      },
      { titulo: "Conclusiones", parrafos: [acta.conclusiones || "Sin conclusiones."] },
    ],
    pie: "Documento de la Junta Vecinal de Villa de Fátima. Una vez publicada, el acta no se puede modificar.",
  });
}

function revisar(datos: DatosActa, ahora: Date) {
  const { errores, acta } = prepararActa(datos, ahora);
  if (Object.keys(errores).length) throw new ErrorValidacion(undefined, errores);
  return acta;
}

/**
 * Publica el acta (HU-ASA-11 CA3): la confirmación de la directiva la aprueba y la publica, queda
 * inalterable y avisa a cada vecino activo, todo en una transacción (AC-6, ADR-006). Repetir el mismo
 * `idOperacion` devuelve lo ya publicado sin avisar otra vez (AC-5).
 */
export async function publicarActa(
  sesion: SesionDto,
  datos: DatosActa & { idOperacion: string },
  ahora = new Date(),
) {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  const acta = revisar(datos, ahora);
  const previa = await buscarActaPorIdOperacion(datos.idOperacion);
  if (previa) return { acta: aDto(previa), creado: false };

  const creada = await prisma.$transaction(async (tx) => {
    const fila = await crearActa(tx, {
      ...acta,
      idOperacion: datos.idOperacion,
      autorId: sesion.usuarioId,
      autor: sesion.nombreCompleto,
      fechaPublicacion: ahora,
    });
    const avisados = await avisarALaComunidad(
      {
        tipo: "ASAMBLEAS",
        titulo: `Acta publicada: ${acta.titulo}`,
        texto: `Ya puede leer el acta de la asamblea del ${fechaLarga(acta.fechaAsamblea).toLowerCase()} en Actas y balances.`,
      },
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "publicar_acta",
        entidad: "Acta",
        entidadId: fila.id,
        antes: null,
        despues: { titulo: acta.titulo, fechaAsamblea: datos.fechaAsamblea, avisados },
      },
      tx,
    );
    return fila;
  });
  return { acta: aDto(creada), creado: true };
}

/** "Ver cómo queda el PDF" (DIR-ASA-10): el mismo documento con los datos del formulario, sin guardar nada. */
export async function vistaPreviaActa(sesion: SesionDto, datos: DatosActa, ahora = new Date()) {
  exigirRol(sesion, "DIRECTIVA", "DIRECTIVO_MEDIADOR");
  return pdfDelActa(revisar(datos, ahora), null);
}

/** El acta publicada en PDF, para todo vecino con sesión (HU-ASA-11 CA2). */
export async function descargarActa(sesion: SesionDto, id: string) {
  exigirRol(sesion, ...ROLES_VECINO);
  const fila = await buscarActa(id);
  if (!fila) throw new ErrorNoEncontrado();
  const acta = {
    titulo: fila.titulo,
    fechaAsamblea: fila.acta!.fechaAsamblea,
    acuerdos: fila.acta!.acuerdos,
    compromisos: fila.acta!.compromisos,
    conclusiones: fila.acta!.conclusiones,
  };
  return {
    nombreArchivo: nombreDeArchivo(fila.titulo),
    pdf: await pdfDelActa(acta, { autor: fila.autor, fecha: fila.fechaPublicacion }),
  };
}

/** Las actas publicadas, las más nuevas primero (VEC-TRA-02). */
export async function actasPublicadas(sesion: SesionDto): Promise<ActaDto[]> {
  exigirRol(sesion, ...ROLES_VECINO);
  return (await listarActas()).map(aDto);
}
