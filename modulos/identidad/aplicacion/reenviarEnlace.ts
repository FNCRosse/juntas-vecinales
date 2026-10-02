// @HU-GAR-11
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { ErrorEnPausa, ErrorNoEncontrado, ErrorReglaNegocio } from "@/compartido/errores";
import { puedeEmitirOtro } from "@/modulos/identidad/dominio/magicLink";
import { enlacesEmitidosDesde } from "@/modulos/identidad/infraestructura/repositorioEnlaces";
import { emitirEnlace } from "./emitirEnlace";
import { MENSAJE_MUCHOS, MENSAJE_MUY_SEGUIDO, MENSAJE_SIN_WHATSAPP } from "./entradaAlterna";
import { exigirRol, type SesionDto } from "./sesion";

/** La administración reenvía el enlace de entrada desde la ficha de la vivienda (ADM-PAD-02). */
export async function reenviarEnlace(
  sesion: SesionDto,
  usuarioId: string,
  origen: string,
  ahora = new Date(),
) {
  exigirRol(sesion, "ADMINISTRADOR");
  const usuario = await prisma.usuario.findFirst({ where: { id: usuarioId, estado: "ACTIVA" } });
  if (!usuario) throw new ErrorNoEncontrado();
  if (!usuario.telefonoWhatsApp) throw new ErrorReglaNegocio(MENSAJE_SIN_WHATSAPP);
  const permiso = puedeEmitirOtro(
    await enlacesEmitidosDesde(usuario.id, new Date(ahora.getTime() - 3_600_000)),
    ahora,
  );
  if (permiso !== "SI")
    throw new ErrorEnPausa(permiso === "MUY_SEGUIDO" ? MENSAJE_MUY_SEGUIDO : MENSAJE_MUCHOS);

  await prisma.$transaction(async (tx) => {
    await emitirEnlace(tx, usuario, origen, ahora);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "reenviar_enlace",
        entidad: "Usuario",
        entidadId: usuario.id,
        antes: null,
        despues: { enlaceEnviado: true },
      },
      tx,
    );
  });
  return { nombre: usuario.nombreCompleto, telefonoTerminadoEn: usuario.telefonoWhatsApp.slice(-3) };
}
