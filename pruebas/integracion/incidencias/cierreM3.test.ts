import { randomUUID } from "node:crypto";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { anonimizar, datosPersonales } from "@/modulos/incidencias/aplicacion/datosPersonales";
import {
  bandejaDeQuejas,
  bloqueDeReportes,
  misQuejas,
  registrarQueja,
} from "@/modulos/incidencias/aplicacion/quejas";
import { evaluarAdmisibilidad } from "@/modulos/incidencias/aplicacion/gestion";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const T0 = new Date("2026-09-27T15:24:00Z");
let carmen: SesionDto;
let marta: SesionDto;

async function reportar(esAnonimo: boolean, categoria = "RUIDOS") {
  const foto = await prisma.archivo.create({
    data: {
      clave: `evidencias/${randomUUID()}.jpg`,
      tipo: "image/jpeg",
      tamano: 1000,
      uso: "evidencia_queja",
      subidoPor: carmen.usuarioId,
    },
  });
  return (
    await registrarQueja(
      carmen,
      {
        categoria,
        descripcion: "Algo pasó",
        manzana: "C",
        referencia: "al lado de mi casa",
        latitud: -12.0431,
        longitud: -77.0282,
        evidencias: [foto.id],
        consentimiento: true,
        esAnonimo,
        idOperacion: randomUUID(),
      },
      T0,
    )
  ).queja;
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, incidencias_quejas CASCADE`;
  await sembrar("clave-de-prueba");
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni: "08123478" } });
  carmen = { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
  ({ sesion: marta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-19 Bloque de reportes del panel de inicio", () => {
  it("@HU-GAR-19 CA1 CA3 cuenta los reportes abiertos y muestra el último con su estado", async () => {
    expect(await bloqueDeReportes(carmen)).toEqual({ abiertos: 0, ultimo: null });
    const primera = await reportar(false);
    const segunda = await reportar(true, "BASURA");
    await evaluarAdmisibilidad(marta, primera.id, { decision: "rechazar", motivo: "Es falso." }, T0);
    expect(await bloqueDeReportes(carmen)).toEqual({
      abiertos: 1,
      ultimo: { numero: segunda.numero, categoria: "Basura", estado: "Recibido, pendiente de revisión" },
    });
  });
});

describe("@HU-GAR-12 @HU-GAR-14 Reportes en la copia de datos y en la cancelación", () => {
  it("@HU-GAR-12 CA1 la copia trae sus reportes con nombre y sus coordenadas; nunca los anónimos", async () => {
    const conNombre = await reportar(false);
    await reportar(true, "SEGURIDAD");
    const [seccion] = await datosPersonales(carmen.usuarioId);
    expect(seccion.titulo).toBe("Reportes de incidentes");
    expect(seccion.filas?.[0]).toEqual(["Reportes enviados con su nombre", "1"]);
    expect(seccion.filas?.[1][0]).toContain(conNombre.numero);
    expect(seccion.filas?.[1][1]).toContain("coordenadas -12.0431, -77.0282");
    expect(JSON.stringify(seccion)).not.toContain("Seguridad");
  });

  it("@HU-GAR-14 CA3 al cancelar, sus reportes quedan anónimos, sin referencia ni coordenadas, y nada los une a ella", async () => {
    await reportar(false);
    const anonima = await reportar(true);
    await prisma.$transaction((tx) => anonimizar(carmen.usuarioId, tx));
    const filas = await prisma.queja.findMany({ include: { identidadProtegida: true } });
    for (const f of filas) {
      expect(f).toMatchObject({
        denuncianteId: null,
        esAnonimo: true,
        referencia: null,
        latitud: null,
        longitud: null,
      });
      expect(f.identidadProtegida).toBeNull();
    }
    expect(await misQuejas(carmen)).toEqual([]);
    expect((await bandejaDeQuejas(marta)).quejas.map((q) => q.quien)).toEqual([
      "Reporte anónimo",
      "Reporte anónimo",
    ]);
    expect(filas.map((f) => f.codigoTicket)).toContain(anonima.codigo);
  });
});
