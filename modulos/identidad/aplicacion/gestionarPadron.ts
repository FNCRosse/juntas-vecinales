// @HU-GAR-10 @HU-GAR-09
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { primerNombre } from "@/compartido/fechas";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { plantillaBajaPadron } from "@/compartido/notificaciones/plantillas";
import { conRolDeEquipo, rolDeEquipo } from "@/modulos/identidad/dominio/equipo";
import {
  cambiosDeOcupacion,
  direccion,
  MOTIVOS_BAJA_RESIDENTE,
  type MotivoBajaResidente,
  normalizarPredio,
  type Ocupacion,
  type UsoPredio,
} from "@/modulos/identidad/dominio/predio";
import { revocarSesionesDe } from "@/modulos/identidad/infraestructura/repositorioEquipo";
import {
  buscarPredio,
  cerrarResidencia,
  guardarOcupacion,
} from "@/modulos/identidad/infraestructura/repositorioPadron";
import { exigirRol, type SesionDto } from "./sesion";

export { MOTIVOS_BAJA_RESIDENTE };
export type { MotivoBajaResidente };

/**
 * Actualiza el uso y la ocupación del predio (HU-GAR-10 CA1). Queda en el historial con cada campo,
 * su valor anterior y el nuevo y quién lo cambió (CA3). El recálculo de la cuota desde el siguiente
 * ciclo (CA2) lo hace M5 con esta ocupación.
 */
export async function actualizarPredio(
  sesion: SesionDto,
  predioId: string,
  datos: { uso: UsoPredio } & Ocupacion,
) {
  exigirRol(sesion, "ADMINISTRADOR");
  const predio = await buscarPredio(predioId);
  if (!predio) throw new ErrorNoEncontrado();
  const { errores } = normalizarPredio({ ...datos, manzana: predio.manzana, lote: predio.lote });
  if (Object.keys(errores).length) {
    throw new ErrorValidacion(
      undefined,
      Object.fromEntries(Object.entries(errores).map(([campo, mensaje]) => [`vivienda.${campo}`, mensaje])),
    );
  }
  const cambios = cambiosDeOcupacion(predio, datos);
  if (!cambios.length) throw new ErrorReglaNegocio("No cambió ningún dato. Cambie lo que ya no es igual.");
  await prisma.$transaction(async (tx) => {
    await guardarOcupacion(tx, predioId, datos);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "actualizar_predio",
        entidad: "Predio",
        entidadId: predioId,
        antes: Object.fromEntries(cambios.map((c) => [c.campo, c.antes])),
        despues: Object.fromEntries(cambios.map((c) => [c.campo, c.despues])),
      },
      tx,
    );
  });
  return { direccion: direccion(predio), cambios: cambios.length };
}

/**
 * Da de baja a un residente que se muda (HU-GAR-09): cierra su residencia sin borrar nada, su cuenta
 * pasa a inactiva (si es del equipo, conserva solo ese rol), cierra todas sus sesiones y sale de la
 * garita (CA2). Se le avisa a su WhatsApp (CA3). Sus pagos anteriores se conservan.
 */
export async function darDeBajaResidente(
  sesion: SesionDto,
  predioId: string,
  usuarioId: string,
  motivo: MotivoBajaResidente,
  ahora = new Date(),
) {
  exigirRol(sesion, "ADMINISTRADOR");
  const predio = await buscarPredio(predioId);
  const residencia = predio?.residencias.find((r) => r.usuarioId === usuarioId);
  if (!predio || !residencia) throw new ErrorNoEncontrado();
  const { usuario } = residencia;
  const delEquipo = rolDeEquipo(usuario.roles) !== null || usuario.roles.includes("ADMINISTRADOR");
  const dir = direccion(predio);

  await prisma.$transaction(async (tx) => {
    await cerrarResidencia(tx, residencia.id, ahora);
    await tx.usuario.update({
      where: { id: usuario.id },
      data: delEquipo
        ? { roles: usuario.roles.filter((rol) => rol !== "VECINO" && rol !== "VECINO_ADULTO_MAYOR") }
        : { estado: "DESVINCULADA", roles: conRolDeEquipo(usuario.roles, null) },
    });
    await revocarSesionesDe(tx, usuario.id, ahora);
    await encolarAviso(
      {
        destinatarioId: usuario.id,
        titulo: "Sus accesos de vecino quedaron cancelados",
        texto: `La junta registró que ya no vive en ${dir}. Sus pagos anteriores se conservan.`,
        whatsapp: usuario.telefonoWhatsApp
          ? {
              telefono: usuario.telefonoWhatsApp,
              ...plantillaBajaPadron(primerNombre(usuario.nombreCompleto), dir),
            }
          : undefined,
      },
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "dar_de_baja_residente",
        entidad: "Residencia",
        entidadId: residencia.id,
        antes: {
          usuarioId: usuario.id,
          nombre: usuario.nombreCompleto,
          relacion: residencia.relacion,
          estado: usuario.estado,
        },
        despues: {
          fechaFin: ahora.toISOString(),
          estado: delEquipo ? usuario.estado : "DESVINCULADA",
          motivo: MOTIVOS_BAJA_RESIDENTE[motivo],
        },
      },
      tx,
    );
  });
  return { nombre: usuario.nombreCompleto, direccion: dir };
}
