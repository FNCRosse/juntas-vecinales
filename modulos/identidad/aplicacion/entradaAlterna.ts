// @HU-GAR-11 @HU-GAR-25
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { cifrarClave, hashDeToken, nuevoToken } from "@/compartido/claves";
import { ErrorConflicto, ErrorEnPausa, ErrorNoEncontrado, ErrorReglaNegocio, ErrorValidacion } from "@/compartido/errores";
import { primerNombre } from "@/compartido/fechas";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { plantillaClaveCambiada } from "@/compartido/notificaciones/plantillas";
import { pasarPerfilALaCuenta } from "@/modulos/accesibilidad/aplicacion/pasarPerfilALaCuenta";
import { LARGO_MINIMO_CLAVE } from "@/modulos/identidad/dominio/credencialRespaldo";
import {
  estadoDelEnlace,
  interpretarIdentificador,
  type PropositoEnlace,
  puedeEmitirOtro,
} from "@/modulos/identidad/dominio/magicLink";
import {
  bloquearEnlace,
  enlacesEmitidosDesde,
  marcarEnlaceUsado,
} from "@/modulos/identidad/infraestructura/repositorioEnlaces";
import { buscarPorDniOCasa } from "@/modulos/identidad/infraestructura/repositorioPadron";
import { crearSesion } from "@/modulos/identidad/infraestructura/repositorioSesiones";
import { guardarClave } from "@/modulos/identidad/infraestructura/repositorioUsuarios";
import { emitirEnlace } from "./emitirEnlace";
import { MENSAJE_ENLACE_NO_SIRVE, siguientePaso } from "./entrarConEnlace";
import { aSesionDto, type SesionDto } from "./sesion";

export const MENSAJE_NO_ENCONTRADO =
  "No encontramos ese DNI o casa en el padrón. Revíselo o pida ayuda a la administración.";
export const MENSAJE_SIN_WHATSAPP =
  "Su cuenta no tiene un WhatsApp registrado. Pida su enlace a la administración de la junta.";
export const MENSAJE_MUY_SEGUIDO = "Ya le enviamos uno hace un momento. Revise su WhatsApp antes de pedir otro.";
export const MENSAJE_MUCHOS = "Ya pidió varios enlaces en la última hora. Espere un rato o pida ayuda a la administración.";

/**
 * Envía un enlace nuevo de entrada (HU-GAR-11) o para crear una clave (HU-GAR-25), solo al WhatsApp
 * del padrón (R-01). El anterior del mismo tipo deja de servir (CA2). Devuelve los tres últimos
 * números del WhatsApp, para que la persona sepa dónde mirarlo.
 */
export async function pedirEnlace(
  identificador: string,
  proposito: PropositoEnlace,
  origen: string,
  ahora = new Date(),
) {
  const interpretado = interpretarIdentificador(identificador);
  if (!interpretado) {
    throw new ErrorValidacion(undefined, {
      identificador: "Escriba su DNI (8 números) o su casa, por ejemplo Mz. C lote 7.",
    });
  }
  const usuario = await buscarPorDniOCasa(interpretado);
  if (!usuario) throw new ErrorNoEncontrado(MENSAJE_NO_ENCONTRADO);
  if (!usuario.telefonoWhatsApp) throw new ErrorReglaNegocio(MENSAJE_SIN_WHATSAPP);

  const recientes = await enlacesEmitidosDesde(usuario.id, new Date(ahora.getTime() - 60 * 60_000));
  const permiso = puedeEmitirOtro(recientes, ahora);
  if (permiso === "MUY_SEGUIDO") throw new ErrorEnPausa(MENSAJE_MUY_SEGUIDO);
  if (permiso === "EN_PAUSA") throw new ErrorEnPausa(MENSAJE_MUCHOS);

  await prisma.$transaction((tx) => emitirEnlace(tx, usuario, origen, ahora, proposito));
  return { telefonoTerminadoEn: usuario.telefonoWhatsApp.slice(-3) };
}

/**
 * Crea la clave nueva con el enlace del WhatsApp (HU-GAR-25 CA3): la anterior deja de servir, se le
 * avisa del cambio y queda dentro de su cuenta. El enlace se gasta en la misma transacción.
 */
export async function restablecerClave(
  token: string,
  clave: string,
  perfilDispositivo: string | undefined,
  ahora = new Date(),
): Promise<{ token: string; sesion: SesionDto; destino: string }> {
  if (clave.length < LARGO_MINIMO_CLAVE) {
    throw new ErrorValidacion(undefined, {
      clave: `La clave necesita al menos ${LARGO_MINIMO_CLAVE} números o letras.`,
    });
  }
  const cifrada = await cifrarClave(clave);
  const sesionNueva = nuevoToken();
  const usuario = await prisma.$transaction(async (tx) => {
    const enlace = await bloquearEnlace(tx, hashDeToken(token));
    if (!enlace || enlace.proposito !== "CLAVE" || estadoDelEnlace(enlace, ahora) !== "VIGENTE") {
      throw new ErrorConflicto(MENSAJE_ENLACE_NO_SIRVE);
    }
    const usuario = await tx.usuario.findUniqueOrThrow({ where: { id: enlace.usuarioId } });
    if (usuario.estado !== "ACTIVA") throw new ErrorConflicto(MENSAJE_ENLACE_NO_SIRVE);
    await marcarEnlaceUsado(tx, enlace.id, ahora);
    await guardarClave(tx, usuario.id, cifrada);
    await crearSesion(usuario.id, sesionNueva.hash, tx);
    await encolarAviso(
      {
        destinatarioId: usuario.id,
        titulo: "Su clave de respaldo cambió",
        texto: "Si no fue usted, avise a la administración de la junta.",
        whatsapp: usuario.telefonoWhatsApp
          ? { telefono: usuario.telefonoWhatsApp, ...plantillaClaveCambiada(primerNombre(usuario.nombreCompleto)) }
          : undefined,
      },
      tx,
    );
    await registrarAuditoria(
      {
        actorId: usuario.id,
        accion: "restablecer_clave_respaldo",
        entidad: "CredencialRespaldo",
        entidadId: usuario.id,
        antes: null,
        despues: { restablecida: true },
      },
      tx,
    );
    return usuario;
  });
  await pasarPerfilALaCuenta(usuario.id, perfilDispositivo);
  const sesion = aSesionDto(usuario);
  return { token: sesionNueva.token, sesion, destino: siguientePaso(sesion) };
}
