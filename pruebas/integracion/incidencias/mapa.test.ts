import { randomUUID } from "node:crypto";
import { GET as mapaHttp } from "@/app/api/quejas/mapa/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado } from "@/compartido/errores";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { evaluarAdmisibilidad, resolverQueja } from "@/modulos/incidencias/aplicacion/gestion";
import { mapaDeIncidentes } from "@/modulos/incidencias/aplicacion/mapa";
import { registrarQueja } from "@/modulos/incidencias/aplicacion/quejas";

const AHORA = new Date("2026-09-30T15:00:00Z");
const CLAVE = "clave-de-prueba";
let carmen: SesionDto;
let marta: SesionDto;
let tokenMarta: string;

async function reportar(
  manzana: string,
  categoria: string,
  opciones: { esAnonimo?: boolean; fecha?: Date; referencia?: string } = {},
) {
  const foto = await prisma.archivo.create({
    data: {
      clave: `evidencias/${randomUUID()}.jpg`,
      tipo: "image/jpeg",
      tamano: 1000,
      uso: "evidencia_queja",
      subidoPor: carmen.usuarioId,
    },
  });
  const { queja } = await registrarQueja(
    carmen,
    {
      categoria,
      descripcion: "Algo pasó",
      manzana,
      referencia: opciones.referencia ?? "frente a la casa de la Sra. Elena",
      latitud: -12.0431,
      longitud: -77.0282,
      evidencias: [foto.id],
      consentimiento: true,
      esAnonimo: opciones.esAnonimo,
      idOperacion: randomUUID(),
    },
    opciones.fecha ?? AHORA,
  );
  return queja;
}

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_archivos, incidencias_quejas CASCADE`;
  await sembrar(CLAVE);
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni: "08123478" } });
  carmen = { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-QUE-08 @HU-ACC-07 Mapa de incidentes", () => {
  it("@HU-QUE-08 CA1 CA3 muestra solo los validados (en revisión, resueltos, derivados) y cambia apenas la directiva decide", async () => {
    const recibida = await reportar("C", "RUIDOS");
    const rechazada = await reportar("A", "BASURA");
    await evaluarAdmisibilidad(marta, rechazada.id, { decision: "rechazar", motivo: "Es falso." }, AHORA);
    expect((await mapaDeIncidentes(carmen, AHORA)).totales.total).toBe(0);

    await evaluarAdmisibilidad(marta, recibida.id, { decision: "admitir", prioridad: "MEDIA" }, AHORA);
    let mapa = await mapaDeIncidentes(carmen, AHORA);
    expect(mapa.totales).toMatchObject({ total: 1, enRevision: 1 });
    expect(mapa.zonas.find((z) => z.zona === "Mz. C")).toMatchObject({ total: 1, intensidad: "muchos" });

    await resolverQueja(marta, recibida.id, { medida: "MEDIACION", detalle: "Acordaron." }, AHORA);
    mapa = await mapaDeIncidentes(carmen, AHORA);
    expect(mapa.totales).toMatchObject({ total: 1, resueltos: 1, enRevision: 0 });
    expect(mapa.recientes).toEqual([
      {
        categoria: "RUIDOS",
        tipo: "Ruidos molestos",
        zona: "Mz. C",
        fecha: AHORA.toISOString(),
        estado: "Resuelto",
      },
    ]);
  });

  it("@HU-QUE-08 CA2 @HU-GAR-15 nada identifica el lote: ni coordenadas, ni referencia, ni quién; también los anónimos", async () => {
    for (const q of [await reportar("D", "SEGURIDAD", { esAnonimo: true }), await reportar("D", "BASURA")]) {
      await evaluarAdmisibilidad(marta, q.id, { decision: "admitir", prioridad: "ALTA" }, AHORA);
    }
    const respuesta = await mapaHttp(
      new Request("http://localhost/api/quejas/mapa", { headers: { cookie: `sesion=${tokenMarta}` } }),
      undefined,
    );
    const texto = JSON.stringify(await respuesta.json());
    for (const dato of ["-12.04", "-77.02", "Elena", "Carmen", "lote", carmen.usuarioId])
      expect(texto).not.toContain(dato);
    expect(texto).toContain("Mz. D");
  });

  it("@HU-QUE-08 solo el último mes; @HU-ACC-07 CA2 trae la descripción textual; el vigilante no lo ve", async () => {
    const vieja = await reportar("B", "RUIDOS", { fecha: new Date("2026-08-01T15:00:00Z") });
    await evaluarAdmisibilidad(marta, vieja.id, { decision: "admitir", prioridad: "BAJA" }, AHORA);
    const reciente = await reportar("B", "BASURA");
    await evaluarAdmisibilidad(marta, reciente.id, { decision: "admitir", prioridad: "BAJA" }, AHORA);
    const mapa = await mapaDeIncidentes(carmen, AHORA);
    expect(mapa.totales.total).toBe(1);
    expect(mapa.descripcion.etiqueta).toBe("Mapa del barrio por manzanas. Mz. B: 1 de basura.");
    const { sesion: luis } = await iniciarSesionConClave({ dni: "40000004", clave: CLAVE });
    await expect(mapaDeIncidentes(luis, AHORA)).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });
});
