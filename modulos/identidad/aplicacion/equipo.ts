// @HU-GAR-21 @HU-GAR-22 @HU-GAR-23
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { cifrarClave, hashDeToken, nuevoToken } from "@/compartido/claves";
import { ErrorConflicto, ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { primerNombre } from "@/compartido/fechas";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { plantillaRolCambiado } from "@/compartido/notificaciones/plantillas";
import { pasarPerfilALaCuenta } from "@/modulos/accesibilidad/aplicacion/pasarPerfilALaCuenta";
import { telefonoCompleto } from "@/modulos/identidad/dominio/empadronamiento";
import {
  conRolDeEquipo,
  diferenciaDePermisos,
  LARGO_MINIMO_CLAVE_EQUIPO,
  MOTIVOS_BAJA,
  type MotivoBaja,
  NOMBRE_ROL,
  PERMISOS,
  PERMISOS_POR_ROL,
  type RolEquipo,
  ROLES_EQUIPO,
  rolDeEquipo,
} from "@/modulos/identidad/dominio/equipo";
import { estadoDelEnlace, venceEn } from "@/modulos/identidad/dominio/magicLink";
import { direccion } from "@/modulos/identidad/dominio/predio";
import {
  bloquearEnlace,
  buscarEnlacePorHash,
  marcarEnlaceUsado,
} from "@/modulos/identidad/infraestructura/repositorioEnlaces";
import {
  anularEnlacesDe,
  buscarConVivienda,
  desvincularCuenta,
  guardarRoles,
  listarMiembros,
  revocarSesionesDe,
} from "@/modulos/identidad/infraestructura/repositorioEquipo";
import { esDuplicado } from "@/modulos/identidad/infraestructura/repositorioPadron";
import { crearSesion } from "@/modulos/identidad/infraestructura/repositorioSesiones";
import { guardarClave } from "@/modulos/identidad/infraestructura/repositorioUsuarios";
import { emitirEnlace } from "./emitirEnlace";
import { MENSAJE_ENLACE_NO_SIRVE } from "./entrarConEnlace";
import { aSesionDto, exigirRol, type SesionDto } from "./sesion";

export { MOTIVOS_BAJA, NOMBRE_ROL, PERMISOS, PERMISOS_POR_ROL, ROLES_EQUIPO, diferenciaDePermisos };
export type { MotivoBaja, RolEquipo };

const telefonoLegible = (telefono: string | null) =>
  telefono?.replace(/^51(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3") ?? null;

/** Cuentas del equipo (ADM-EQU-01): rol, si ya creó su acceso y cuándo entró por última vez. */
export async function listarEquipo(sesion: SesionDto) {
  exigirRol(sesion, "ADMINISTRADOR");
  const miembros = await listarMiembros();
  return miembros.map((m) => {
    const rol = m.roles.includes("ADMINISTRADOR") ? "ADMINISTRADOR" : rolDeEquipo(m.roles);
    const residencia = m.residencias[0];
    return {
      id: m.id,
      nombre: m.nombreCompleto,
      rol,
      rolTexto: rol ? NOMBRE_ROL[rol] : "",
      vivienda: residencia ? direccion(residencia.predio) : null,
      tieneAcceso: m.credencial !== null,
      ultimoAcceso: m.sesiones[0]?.ultimoUsoEn.toISOString() ?? null,
      esUsted: m.id === sesion.usuarioId,
      gestionable: rol !== null && rol !== "ADMINISTRADOR",
    };
  });
}

export type MiembroDto = Awaited<ReturnType<typeof listarEquipo>>[number];

/** Una persona del padrón para darle un rol (ADM-EQU-02): sus datos ya están, no se piden de nuevo. */
export async function buscarEnPadron(sesion: SesionDto, dni: string) {
  exigirRol(sesion, "ADMINISTRADOR");
  const persona = await buscarConVivienda({ dni });
  const residencia = persona?.residencias[0];
  if (!persona || !residencia) {
    throw new ErrorNoEncontrado("No encontramos ese DNI en el padrón. Revíselo o elija «No, es de afuera».");
  }
  return {
    usuarioId: persona.id,
    nombre: persona.nombreCompleto,
    vivienda: direccion(residencia.predio),
    dniTerminadoEn: persona.dni.slice(-2),
    whatsapp: telefonoLegible(persona.telefonoWhatsApp),
    rolActual: rolDeEquipo(persona.roles),
  };
}

export type PersonaDelEquipo =
  { usuarioId: string } | { nombreCompleto: string; dni: string; telefono: string };

/**
 * Da acceso de equipo con un rol (HU-GAR-21): a alguien del padrón o a una persona de afuera. Le
 * llega por WhatsApp una invitación de 48 horas para crear su clave de equipo (CA2). Se audita (CA3).
 */
export async function agregarAlEquipo(
  sesion: SesionDto,
  persona: PersonaDelEquipo,
  rol: RolEquipo,
  origen: string,
  ahora = new Date(),
) {
  exigirRol(sesion, "ADMINISTRADOR");
  try {
    return await prisma.$transaction(async (tx) => {
      let usuario;
      if ("usuarioId" in persona) {
        const existente = await tx.usuario.findFirst({ where: { id: persona.usuarioId, estado: "ACTIVA" } });
        if (!existente) throw new ErrorNoEncontrado();
        const actual = rolDeEquipo(existente.roles);
        if (actual || existente.roles.includes("ADMINISTRADOR")) {
          throw new ErrorReglaNegocio(
            `${existente.nombreCompleto} ya es parte del equipo. Para cambiar su rol, use «Cambiar rol».`,
          );
        }
        usuario = await tx.usuario.update({
          where: { id: existente.id },
          data: { roles: conRolDeEquipo(existente.roles, rol) },
        });
      } else {
        usuario = await tx.usuario.create({
          data: {
            nombreCompleto: persona.nombreCompleto.trim(),
            dni: persona.dni,
            telefonoWhatsApp: telefonoCompleto(persona.telefono),
            roles: [rol],
          },
        });
      }
      if (!usuario.telefonoWhatsApp) {
        throw new ErrorReglaNegocio(
          "Esta persona no tiene un WhatsApp registrado. Actualice su número en el padrón antes de invitarla.",
        );
      }
      await emitirEnlace(tx, usuario, origen, ahora, "EQUIPO");
      const { fecha } = await registrarAuditoria(
        {
          actorId: sesion.usuarioId,
          accion: "dar_acceso_equipo",
          entidad: "Usuario",
          entidadId: usuario.id,
          antes: null,
          despues: { rol, deAfuera: !("usuarioId" in persona) },
        },
        tx,
      );
      return {
        usuarioId: usuario.id,
        nombre: usuario.nombreCompleto,
        rolTexto: NOMBRE_ROL[rol],
        whatsapp: telefonoLegible(usuario.telefonoWhatsApp),
        invitacionVence: venceEn(ahora, "EQUIPO").toISOString(),
        registradoEn: fecha.toISOString(),
        registradoPor: sesion.nombreCompleto,
      };
    });
  } catch (error) {
    if (esDuplicado(error)) {
      throw new ErrorValidacion(undefined, {
        "persona.dni": "Este DNI ya está en la plataforma. Elija «Sí, ya está en el padrón» y búsquelo.",
      });
    }
    throw error;
  }
}

/** Un miembro gestionable del equipo: con rol de directiva, mediador o vigilante, y activo. */
async function miembroGestionable(usuarioId: string) {
  const usuario = await prisma.usuario.findFirst({ where: { id: usuarioId, estado: "ACTIVA" } });
  const rol = usuario && rolDeEquipo(usuario.roles);
  if (!usuario || !rol || usuario.roles.includes("ADMINISTRADOR")) throw new ErrorNoEncontrado();
  return { usuario, rol };
}

/** Para las pantallas de cambiar rol y quitar acceso (ADM-EQU-05, ADM-EQU-07). */
export async function verMiembro(sesion: SesionDto, usuarioId: string) {
  exigirRol(sesion, "ADMINISTRADOR");
  const { usuario, rol } = await miembroGestionable(usuarioId);
  const vecino = await buscarConVivienda({ id: usuarioId });
  const residencia = vecino?.residencias[0];
  return {
    id: usuario.id,
    nombre: usuario.nombreCompleto,
    rol,
    rolTexto: NOMBRE_ROL[rol],
    vivienda: residencia ? direccion(residencia.predio) : null,
  };
}

/**
 * Cambia el rol sin crear otra cuenta (HU-GAR-23 CA1). Los permisos cambian al instante porque cada
 * petición lee los roles de la BD (CA2). Se audita con el rol anterior y el nuevo (CA3) y se le avisa.
 */
export async function cambiarRol(sesion: SesionDto, usuarioId: string, nuevo: RolEquipo) {
  exigirRol(sesion, "ADMINISTRADOR");
  const { usuario, rol } = await miembroGestionable(usuarioId);
  if (rol === nuevo) throw new ErrorReglaNegocio("Es el mismo rol que tiene hoy. Elija otro para cambiarlo.");
  await prisma.$transaction(async (tx) => {
    await guardarRoles(tx, usuario.id, conRolDeEquipo(usuario.roles, nuevo));
    await encolarAviso(
      {
        destinatarioId: usuario.id,
        titulo: `Su rol ahora es ${NOMBRE_ROL[nuevo]}`,
        texto: "Sus permisos en el equipo ya cambiaron. Entra con la misma cuenta.",
        whatsapp: usuario.telefonoWhatsApp
          ? {
              telefono: usuario.telefonoWhatsApp,
              ...plantillaRolCambiado(primerNombre(usuario.nombreCompleto), NOMBRE_ROL[nuevo]),
            }
          : undefined,
      },
      tx,
    );
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "cambiar_rol",
        entidad: "Usuario",
        entidadId: usuario.id,
        antes: { rol },
        despues: { rol: nuevo },
      },
      tx,
    );
  });
  return { nombre: usuario.nombreCompleto, rolTexto: NOMBRE_ROL[nuevo] };
}

/**
 * Quita el acceso de equipo (HU-GAR-22): cierra al instante todas sus sesiones (CA2) y anula una
 * invitación pendiente. Si vive en el barrio, sigue siendo vecino; si es de afuera, su cuenta queda
 * desvinculada. Se audita con el motivo (CA3).
 */
export async function quitarAcceso(
  sesion: SesionDto,
  usuarioId: string,
  motivo: MotivoBaja,
  ahora = new Date(),
) {
  exigirRol(sesion, "ADMINISTRADOR");
  const { usuario, rol } = await miembroGestionable(usuarioId);
  const roles = conRolDeEquipo(usuario.roles, null);
  await prisma.$transaction(async (tx) => {
    await guardarRoles(tx, usuario.id, roles);
    if (!roles.length) await desvincularCuenta(tx, usuario.id);
    await revocarSesionesDe(tx, usuario.id, ahora);
    await anularEnlacesDe(tx, usuario.id, "EQUIPO", ahora);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "quitar_acceso_equipo",
        entidad: "Usuario",
        entidadId: usuario.id,
        antes: { rol, estado: usuario.estado },
        despues: {
          rol: null,
          estado: roles.length ? usuario.estado : "DESVINCULADA",
          motivo: MOTIVOS_BAJA[motivo],
        },
      },
      tx,
    );
  });
  return { nombre: usuario.nombreCompleto, sigueSiendoVecino: roles.length > 0 };
}

/** Lo que muestra la invitación (ADM-ENT-02) sin gastarla: nombre, rol y DNI, que será su usuario. */
export async function consultarInvitacion(token: string, ahora = new Date()) {
  const enlace = await buscarEnlacePorHash(hashDeToken(token));
  if (!enlace || enlace.proposito !== "EQUIPO" || enlace.usuario.estado !== "ACTIVA") return null;
  if (estadoDelEnlace(enlace, ahora) !== "VIGENTE") return null;
  const rol = rolDeEquipo(enlace.usuario.roles);
  return {
    nombre: primerNombre(enlace.usuario.nombreCompleto),
    dni: enlace.usuario.dni,
    rolTexto: rol ? NOMBRE_ROL[rol] : "",
  };
}

/**
 * Crea el acceso de equipo con la invitación (HU-GAR-21 CA2): una clave de al menos 12 caracteres,
 * que se puede pegar o dejar al gestor (WCAG 3.3.8). Gasta la invitación y entra.
 */
export async function crearAccesoEquipo(
  token: string,
  clave: string,
  perfilDispositivo: string | undefined,
  ahora = new Date(),
): Promise<{ token: string; sesion: SesionDto }> {
  if (clave.length < LARGO_MINIMO_CLAVE_EQUIPO) {
    throw new ErrorValidacion(undefined, {
      clave: `La clave de equipo necesita al menos ${LARGO_MINIMO_CLAVE_EQUIPO} caracteres. Puede usar la que le sugiera su teléfono.`,
    });
  }
  const cifrada = await cifrarClave(clave);
  const sesionNueva = nuevoToken();
  const usuario = await prisma.$transaction(async (tx) => {
    const enlace = await bloquearEnlace(tx, hashDeToken(token));
    if (!enlace || enlace.proposito !== "EQUIPO" || estadoDelEnlace(enlace, ahora) !== "VIGENTE") {
      throw new ErrorConflicto(MENSAJE_ENLACE_NO_SIRVE);
    }
    const usuario = await tx.usuario.findUniqueOrThrow({ where: { id: enlace.usuarioId } });
    if (usuario.estado !== "ACTIVA" || !rolDeEquipo(usuario.roles))
      throw new ErrorConflicto(MENSAJE_ENLACE_NO_SIRVE);
    await marcarEnlaceUsado(tx, enlace.id, ahora);
    await guardarClave(tx, usuario.id, cifrada);
    await crearSesion(usuario.id, sesionNueva.hash, tx);
    await registrarAuditoria(
      {
        actorId: usuario.id,
        accion: "crear_acceso_equipo",
        entidad: "CredencialRespaldo",
        entidadId: usuario.id,
        antes: null,
        despues: { creada: true },
      },
      tx,
    );
    return usuario;
  });
  await pasarPerfilALaCuenta(usuario.id, perfilDispositivo);
  return { token: sesionNueva.token, sesion: aSesionDto(usuario) };
}
