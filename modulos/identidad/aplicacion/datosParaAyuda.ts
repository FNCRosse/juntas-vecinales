// @HU-ACC-04
import { prisma } from "@/compartido/bd/cliente";
import { direccion } from "@/modulos/identidad/dominio/predio";
import { buscarConVivienda } from "@/modulos/identidad/infraestructura/repositorioEquipo";
import type { SesionDto } from "./sesion";

/** "Carmen Huamán, Mz. C, lote 7" y el final de su teléfono: lo que ve quien pide ayuda (VEC-AYU-01). */
export async function quienPideAyuda(sesion: SesionDto) {
  const persona = await buscarConVivienda({ id: sesion.usuarioId });
  const residencia = persona?.residencias[0];
  return {
    quien: residencia ? `${sesion.nombreCompleto}, ${direccion(residencia.predio)}` : sesion.nombreCompleto,
    telefonoTerminadoEn: persona?.telefonoWhatsApp?.slice(-3) ?? null,
  };
}

/** A quién avisar: los directivos mediadores activos; si no hay, la directiva (HU-ACC-04 CA2). */
export async function mediadoresDeTurno() {
  for (const rol of ["DIRECTIVO_MEDIADOR", "DIRECTIVA"] as const) {
    const personas = await prisma.usuario.findMany({
      where: { estado: "ACTIVA", roles: { has: rol } },
      orderBy: { nombreCompleto: "asc" },
    });
    if (personas.length) {
      return personas.map((p) => ({
        usuarioId: p.id,
        nombre: p.nombreCompleto,
        telefono: p.telefonoWhatsApp,
      }));
    }
  }
  return [];
}

/** El contacto de la administración, para el "Pedir ayuda" del equipo. */
export async function contactoDeAdministracion() {
  const admin = await prisma.usuario.findFirst({
    where: { estado: "ACTIVA", roles: { has: "ADMINISTRADOR" } },
    orderBy: { fechaEmpadronamiento: "asc" },
  });
  return (
    admin && {
      nombre: admin.nombreCompleto,
      telefono: admin.telefonoWhatsApp?.replace(/^51(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3") ?? null,
    }
  );
}
