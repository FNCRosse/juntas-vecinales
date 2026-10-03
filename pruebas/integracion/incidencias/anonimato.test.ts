import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { auditoriaGlobal } from "@/modulos/identidad/aplicacion/auditoria";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { bandejaDeQuejas, misQuejas, registrarQueja } from "@/modulos/incidencias/aplicacion/quejas";
import { descifrar } from "@/modulos/incidencias/infraestructura/identidadProtegida";

const T0 = new Date("2026-09-27T15:24:00Z");
const CLAVE = "clave-de-prueba";
let carmen: SesionDto;
let julio: SesionDto;
let marta: SesionDto;

async function sesionDe(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

async function reportar(sesion: SesionDto, esAnonimo: boolean) {
  const foto = await prisma.archivo.create({
    data: {
      clave: `evidencias/${randomUUID()}.jpg`,
      tipo: "image/jpeg",
      tamano: 1000,
      uso: "evidencia_queja",
      subidoPor: sesion.usuarioId,
    },
  });
  return registrarQueja(
    sesion,
    {
      categoria: "SEGURIDAD",
      descripcion: "Robaron el espejo de un auto",
      manzana: "D",
      referencia: null,
      evidencias: [foto.id],
      consentimiento: true,
      esAnonimo,
      idOperacion: randomUUID(),
    },
    T0,
  );
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones, nucleo_archivos, incidencias_quejas CASCADE`;
  await sembrar(CLAVE);
  carmen = await sesionDe("08123478");
  julio = await sesionDe("40000006");
  ({ sesion: marta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-QUE-02 Modo anónimo", () => {
  it("@HU-QUE-02 CA1 CA2 la queja anónima no guarda a la vista quién la envió; solo cifrado", async () => {
    const { queja } = await reportar(carmen, true);
    const fila = await prisma.queja.findUniqueOrThrow({
      where: { id: queja.id },
      include: { identidadProtegida: true },
    });
    expect(fila).toMatchObject({ esAnonimo: true, denuncianteId: null });
    expect(fila.identidadProtegida!.datosCifrados).not.toContain(carmen.usuarioId);
    expect(descifrar(fila.identidadProtegida!.datosCifrados)).toBe(carmen.usuarioId);
    expect(queja.esAnonimo).toBe(true);
  });

  it("@HU-QUE-02 CA2 la directiva ve 'Reporte anónimo'; el aviso y la auditoría no dicen quién fue", async () => {
    await reportar(carmen, true);
    await reportar(julio, false);
    const { quejas } = await bandejaDeQuejas(marta);
    expect(quejas.map((q) => q.quien).sort()).toEqual(["Julio Mendoza", "Reporte anónimo"]);
    expect(JSON.stringify(quejas)).not.toContain("Carmen");

    const avisos = await prisma.avisoEnCola.findMany({ where: { tipo: "REPORTES" } });
    expect(JSON.stringify(avisos)).not.toContain("Carmen");
    const registro = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "registrar_queja", despues: { path: ["anonimo"], equals: true } },
    });
    expect(registro.actorId).toBe("ANONIMO");
    const { sesion: ana } = await iniciarSesionConClave({ dni: "40000001", clave: CLAVE });
    const { filas } = await auditoriaGlobal(ana, { modulo: "Incidentes" });
    // La auditoría no se vacía entre pruebas: las dos más recientes son las de esta prueba.
    expect(filas.slice(0, 2).map((f) => f.responsable)).toEqual(["Julio Mendoza", "Persona anónima"]);
  });

  it("@HU-QUE-02 CA3 el denunciante anónimo recibe su código y ve el reporte entre los suyos; nadie más", async () => {
    const { queja } = await reportar(carmen, true);
    expect(queja.codigo).toMatch(/^Q-2026-\d{5}-[A-Z2-9]{4}$/);
    expect((await misQuejas(carmen)).map((q) => q.codigo)).toEqual([queja.codigo]);
    expect(await misQuejas(julio)).toEqual([]);
  });

  it("@HU-QUE-02 la base de datos no deja guardar una anónima con el denunciante a la vista", async () => {
    const { queja } = await reportar(carmen, true);
    await expect(
      prisma.queja.update({ where: { id: queja.id }, data: { denuncianteId: carmen.usuarioId } }),
    ).rejects.toThrow();
  });
});
