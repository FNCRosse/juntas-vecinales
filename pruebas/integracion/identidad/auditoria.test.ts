import { GET as auditoriaHttp } from "@/app/api/admin/auditoria/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado } from "@/compartido/errores";
import { auditoriaGlobal, POR_PAGINA } from "@/modulos/identidad/aplicacion/auditoria";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { describirAccion } from "@/compartido/auditoria/acciones";

// La auditoría no se puede vaciar: cada prueba filtra por las personas recién sembradas (ids nuevos).
const T0 = new Date("2026-10-05T15:00:00Z");
const minutos = (m: number) => new Date(T0.getTime() + m * 60_000);
let ana: SesionDto;
let tokenAna: string;
let marta: SesionDto;

const registrar = (actorId: string | null, accion: string, fecha: Date, despues: object | null = null) =>
  prisma.registroAuditoria.create({
    data: { actorId, accion, entidad: "Prueba", entidadId: "p", fecha, despues: despues ?? undefined },
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios CASCADE`;
  await sembrar("clave-de-prueba");
  ({ sesion: ana, token: tokenAna } = await iniciarSesionConClave({
    dni: "40000001",
    clave: "clave-de-prueba",
  }));
  ({ sesion: marta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-26 Auditoría global", () => {
  it("@HU-GAR-26 CA1 une las acciones de todos los módulos, de la más reciente a la más antigua", async () => {
    await registrar(ana.usuarioId, "empadronar", minutos(1), { vivienda: "Mz. E, lote 4", familias: 1 });
    await registrar(ana.usuarioId, "abrir_por_emergencia", minutos(3), { motivo: "Una emergencia de salud" });
    await registrar(ana.usuarioId, "aprobar_arco", minutos(2), { estado: "APROBADA", verificacion: null });
    await registrar(ana.usuarioId, "accion_de_un_modulo_futuro", minutos(4), {
      politicaVersion: "2026-10",
      politicaAceptadaEn: "2026-10-05T15:00:00.000Z",
    });

    const { filas } = await auditoriaGlobal(ana, { responsable: ana.usuarioId });
    expect(filas.slice(0, 4).map((f) => [f.modulo, f.texto, f.responsable])).toEqual([
      ["Otros", "accion de un modulo futuro", "Ana Flores"],
      ["Garita", "Abrió la reja por una emergencia", "Ana Flores"],
      ["Privacidad", "Aprobó una solicitud de privacidad", "Ana Flores"],
      ["Padrón", "Empadronó una vivienda", "Ana Flores"],
    ]);
    expect(filas[3]).toMatchObject({
      fecha: "5 de octubre de 2026 a las 10:01 a. m.",
      detalle: "Familias: 1 · Vivienda: Mz. E, lote 4",
    });
    // Los nombres de campo y las fechas se leen en lenguaje llano, no como los guarda la base.
    expect(filas[0].detalle).toBe(
      "Politica version: 2026-10 · Politica aceptada en: 5 de octubre de 2026 a las 10:00 a. m.",
    );
  });

  it("@HU-GAR-26 CA2 filtra por módulo, por acción y por responsable, también lo que hizo el sistema", async () => {
    await registrar(ana.usuarioId, "empadronar", minutos(1));
    await registrar(ana.usuarioId, "cambiar_rol", minutos(2));
    await registrar(marta.usuarioId, "aceptar_politica", minutos(3));
    await registrar(null, "aprobar_arco", minutos(4));

    const porModulo = await auditoriaGlobal(ana, { modulo: "Equipo", responsable: ana.usuarioId });
    expect(porModulo.filas.map((f) => f.texto)).toEqual(["Cambió un rol del equipo"]);
    expect(porModulo.acciones.map((a) => a.valor)).toEqual(
      expect.arrayContaining(["cambiar_rol", "quitar_acceso_equipo"]),
    );
    expect(porModulo.acciones.map((a) => a.valor)).not.toContain("empadronar");

    const porAccion = await auditoriaGlobal(ana, {
      accion: "aceptar_politica",
      responsable: marta.usuarioId,
    });
    expect(porAccion.filas.map((f) => f.responsable)).toEqual(["Marta Rojas"]);

    const delSistema = await auditoriaGlobal(ana, { responsable: "sistema" });
    expect(delSistema.filas.every((f) => f.responsable === "El sistema (automático)")).toBe(true);
    expect(delSistema.responsables).toEqual(
      expect.arrayContaining([
        { valor: ana.usuarioId, texto: "Ana Flores" },
        { valor: "sistema", texto: "El sistema (automático)" },
      ]),
    );

    const respuesta = await auditoriaHttp(
      new Request(`http://localhost/api/admin/auditoria?modulo=Padr%C3%B3n&responsable=${ana.usuarioId}`, {
        headers: { cookie: `sesion=${tokenAna}` },
      }),
      undefined,
    );
    expect(respuesta.status).toBe(200);
    expect((await respuesta.json()).filas.map((f: { texto: string }) => f.texto)).toEqual([
      "Empadronó una vivienda",
    ]);
  });

  it("@HU-GAR-26 pagina de 50 en 50 hacia atrás", async () => {
    for (let i = 0; i < POR_PAGINA + 1; i++) await registrar(marta.usuarioId, "aceptar_politica", minutos(i));
    const primera = await auditoriaGlobal(ana, { responsable: marta.usuarioId });
    expect(primera.filas).toHaveLength(POR_PAGINA);
    expect(primera.siguiente).toBe(minutos(1).toISOString());
    const segunda = await auditoriaGlobal(ana, {
      responsable: marta.usuarioId,
      antes: primera.siguiente ?? "",
    });
    expect(segunda.filas).toHaveLength(1);
    expect(segunda.siguiente).toBeNull();
  });

  it("@HU-GAR-26 CA3 es de solo lectura y solo la ve la administración", async () => {
    const fila = await registrar(ana.usuarioId, "empadronar", T0);
    await expect(
      prisma.registroAuditoria.update({ where: { id: fila.id }, data: { accion: "otra" } }),
    ).rejects.toThrow();
    await expect(prisma.registroAuditoria.delete({ where: { id: fila.id } })).rejects.toThrow();
    await expect(auditoriaGlobal(marta)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    expect(describirAccion("descargar_copia_datos").modulo).toBe("Privacidad");
  });
});
