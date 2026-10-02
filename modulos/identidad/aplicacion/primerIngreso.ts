// @HU-GAR-02
import { registrarAuditoria } from "@/compartido/auditoria/registrar";
import { prisma } from "@/compartido/bd/cliente";
import { cifrarClave } from "@/compartido/claves";
import { ErrorValidacion } from "@/compartido/errores";
import { faltaAceptarPolitica, VERSION_POLITICA } from "@/modulos/identidad/dominio/politica";
import { LARGO_MINIMO_CLAVE } from "@/modulos/identidad/dominio/credencialRespaldo";
import {
  buscarUsuario,
  guardarClave,
  marcarPoliticaAceptada,
} from "@/modulos/identidad/infraestructura/repositorioUsuarios";
import type { SesionDto } from "./sesion";

export const MENSAJE_FALTA_ACEPTAR =
  "Para continuar, marque la casilla de arriba. Si tiene dudas, pida ayuda a una persona.";

/**
 * Aceptación expresa de la política de privacidad (HU-GAR-02 CA2, Ley 29733): queda la fecha en la
 * cuenta y en la auditoría. Después, el paso opcional de la clave si todavía no tiene una.
 */
export async function aceptarPolitica(sesion: SesionDto, ahora = new Date()) {
  const usuario = await buscarUsuario(sesion.usuarioId);
  if (faltaAceptarPolitica(usuario?.politicaVersion ?? null)) {
    await prisma.$transaction(async (tx) => {
      await marcarPoliticaAceptada(tx, sesion.usuarioId, VERSION_POLITICA, ahora);
      await registrarAuditoria(
        {
          actorId: sesion.usuarioId,
          accion: "aceptar_politica",
          entidad: "Usuario",
          entidadId: sesion.usuarioId,
          antes: { politicaVersion: usuario?.politicaVersion ?? null },
          despues: { politicaVersion: VERSION_POLITICA, politicaAceptadaEn: ahora.toISOString() },
        },
        tx,
      );
    });
  }
  return { destino: usuario?.credencial ? "/" : "/entrar/clave-respaldo" };
}

/** El paso de la clave no pide el DNI: ya lo tenemos (WCAG 3.3.7). */
export async function datosParaClave(sesion: SesionDto) {
  const usuario = await buscarUsuario(sesion.usuarioId);
  return { dni: usuario?.dni ?? "" };
}

/** Clave de respaldo opcional, vinculada al DNI (HU-GAR-02 CA3). Nunca se guarda ni se audita en claro. */
export async function crearClaveRespaldo(sesion: SesionDto, clave: string) {
  if (clave.length < LARGO_MINIMO_CLAVE) {
    throw new ErrorValidacion(undefined, {
      clave: `La clave necesita al menos ${LARGO_MINIMO_CLAVE} números o letras.`,
    });
  }
  const cifrada = await cifrarClave(clave);
  await prisma.$transaction(async (tx) => {
    await guardarClave(tx, sesion.usuarioId, cifrada);
    await registrarAuditoria(
      {
        actorId: sesion.usuarioId,
        accion: "crear_clave_respaldo",
        entidad: "CredencialRespaldo",
        entidadId: sesion.usuarioId,
        antes: null,
        despues: { creada: true },
      },
      tx,
    );
  });
  // Al terminar el primer ingreso se ofrece la guía opcional (HU-GAR-03 CA1).
  return { destino: "/guia" };
}
