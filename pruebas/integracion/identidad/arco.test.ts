import { POST as solicitarHttp } from "@/app/api/arco/solicitudes/route";
import { PATCH as resolverHttp } from "@/app/api/arco/solicitudes/[id]/route";
import { GET as copiaHttp } from "@/app/api/arco/solicitudes/[id]/copia/route";
import { generarPdf } from "@/compartido/archivos/pdf";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  ErrorConflicto,
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorReglaNegocio,
  ErrorValidacion,
} from "@/compartido/errores";
import { datosPersonales as datosDeAccesibilidad } from "@/modulos/accesibilidad/aplicacion/datosPersonales";
import {
  bandejaArco,
  copiaAutorizada,
  datosPersonales,
  miPerfil,
  resolverSolicitudArco,
  resumenArco,
  solicitarCopia,
  solicitarRectificacion,
  verSolicitudArco,
} from "@/modulos/identidad/aplicacion/arco";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  diasHabilesDesde,
  errorDeRectificacion,
  estadoDelPlazo,
  fechaLimite,
  leerVivienda,
  numeroDeSolicitud,
} from "@/modulos/identidad/dominio/arco";

// Lunes 5 de octubre de 2026, 10:00 de Lima.
const LUNES = new Date("2026-10-05T15:00:00Z");
const dias = (n: number) => new Date(LUNES.getTime() + n * 24 * 3_600_000);
let ana: SesionDto;
let tokenAna: string;
let marta: SesionDto;
let tokenMarta: string;

async function vecino(dni: string): Promise<SesionDto> {
  const u = await prisma.usuario.findUniqueOrThrow({ where: { dni } });
  return { usuarioId: u.id, nombreCompleto: u.nombreCompleto, roles: u.roles, politicaAceptada: true };
}

const pedir = (ruta: string, metodo: string, token: string, cuerpo?: unknown) =>
  new Request(`http://localhost${ruta}`, {
    method: metodo,
    headers: { cookie: `sesion=${token}` },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos CASCADE`;
  await sembrar("clave-de-prueba");
  ({ sesion: ana, token: tokenAna } = await iniciarSesionConClave({
    dni: "40000001",
    clave: "clave-de-prueba",
  }));
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({
    dni: "40000002",
    clave: "clave-de-prueba",
  }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-16 plazos en días hábiles", () => {
  it("@HU-GAR-16 CA2 cuenta de lunes a viernes en Lima y alerta a 2 días del vencimiento", () => {
    // Lunes → viernes: 4 días hábiles; → lunes siguiente: 5 (el fin de semana no cuenta).
    expect(diasHabilesDesde(LUNES, dias(4))).toBe(4);
    expect(diasHabilesDesde(LUNES, dias(7))).toBe(5);
    // 11:30 p. m. del lunes en Lima ya es martes en UTC, pero sigue siendo el mismo día.
    expect(diasHabilesDesde(LUNES, new Date("2026-10-06T04:30:00Z"))).toBe(0);
    expect(fechaLimite(LUNES, "RECTIFICACION").toISOString()).toBe("2026-10-19T05:00:00.000Z");
    expect(fechaLimite(LUNES, "ACCESO").toISOString()).toBe("2026-11-02T05:00:00.000Z");
    expect(estadoDelPlazo(LUNES, "RECTIFICACION", dias(10))).toEqual({
      usados: 8,
      plazo: 10,
      restantes: 2,
      porVencer: true,
    });
    expect(numeroDeSolicitud(31)).toBe("S-0031");
  });
});

describe("@HU-GAR-12 Copia de mis datos personales", () => {
  it("@HU-GAR-12 CA1 CA2 CA3 genera el PDF con sus datos, queda registrada y solo la descarga quien la pidió", async () => {
    const respuesta = await solicitarHttp(
      pedir("/api/arco/solicitudes", "POST", tokenMarta, { tipo: "ACCESO" }),
      undefined,
    );
    expect(respuesta.status).toBe(201);
    const { id, numero, descarga } = await respuesta.json();
    expect(descarga).toBe(`/api/arco/solicitudes/${id}/copia`);
    const fila = await prisma.solicitudArco.findUniqueOrThrow({ where: { id } });
    expect(fila).toMatchObject({ tipo: "ACCESO", estado: "RESUELTA_SOLA", usuarioId: marta.usuarioId });
    expect(
      await prisma.registroAuditoria.count({ where: { accion: "descargar_copia_datos", entidadId: id } }),
    ).toBe(1);

    const pdf = await copiaHttp(pedir(descarga, "GET", tokenMarta), { params: Promise.resolve({ id }) });
    expect(pdf.status).toBe(200);
    expect(pdf.headers.get("content-type")).toBe("application/pdf");
    expect(pdf.headers.get("content-disposition")).toContain(`mis-datos-${numero}.pdf`);
    const bytes = Buffer.from(await pdf.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    // PDF etiquetado y en español, para el lector de pantalla.
    expect(bytes.toString("latin1")).toMatch(/\/Lang \(es-PE\)/);
    expect(bytes.toString("latin1")).toMatch(/\/StructTreeRoot/);

    // AC-7: otra persona no la descarga.
    const rosa = await vecino("40000007");
    await expect(copiaAutorizada(rosa, id)).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });

  it("@HU-GAR-12 CA3 las secciones tienen sus datos y ninguno de otros residentes ni de sus visitas", async () => {
    const carmen = await vecino("08123478");
    await prisma.residencia.create({
      data: {
        usuarioId: (await vecino("40000009")).usuarioId,
        predioId: (await prisma.residencia.findFirstOrThrow({ where: { usuarioId: carmen.usuarioId } }))
          .predioId,
        relacion: "OTRO",
      },
    });
    await prisma.visita.create({
      data: {
        predioId: (await prisma.residencia.findFirstOrThrow({ where: { usuarioId: carmen.usuarioId } }))
          .predioId,
        registradaPor: carmen.usuarioId,
        nombre: "Rosa Huamán",
        dni: "41234567",
        desde: LUNES,
        hasta: dias(1),
      },
    });
    const secciones = [
      ...(await datosPersonales(carmen.usuarioId)),
      ...(await datosDeAccesibilidad(carmen.usuarioId)),
    ];
    const texto = JSON.stringify(secciones);
    expect(texto).toContain("Carmen Huamán");
    expect(texto).toContain("08123478");
    expect(texto).toContain("Mz. C, lote 7");
    expect(texto).toContain('["Visitas que registró","1"]');
    expect(texto).not.toMatch(/Víctor Salas|40000009|Rosa Huamán|41234567/);
    expect(secciones.map((s) => s.titulo)).toEqual([
      "Identidad y contacto",
      "Vivienda",
      "Accesibilidad y pedidos de ayuda",
    ]);
    const pdf = await generarPdf({ titulo: "Mis datos", subtitulos: [], secciones, pie: "Fin" });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});

describe("@HU-GAR-13 Rectificar mis datos", () => {
  it("@HU-GAR-13 valida el dato correcto", () => {
    expect(errorDeRectificacion("DNI", "123", "40000002")).toBe("El DNI tiene 8 números.");
    expect(errorDeRectificacion("NOMBRE", "Marta Rojas", "Marta Rojas")).toBe(
      "Es igual al dato que ya tenemos.",
    );
    expect(errorDeRectificacion("DIRECCION", "por ahí", "Mz. A, lote 12")).toMatch(/manzana y el lote/);
    expect(leerVivienda("mz. b lote 5")).toEqual({ manzana: "B", lote: "5" });
  });

  it("@HU-GAR-13 CA1 CA2 CA3 queda pendiente; al aprobarla se corrige en el padrón y se avisa", async () => {
    const respuesta = await solicitarHttp(
      pedir("/api/arco/solicitudes", "POST", tokenMarta, {
        tipo: "RECTIFICACION",
        campo: "NOMBRE",
        valor: " Marta Rojas Paredes ",
        detalle: "Falta mi segundo apellido",
      }),
      undefined,
    );
    expect(respuesta.status).toBe(201);
    const { id } = await respuesta.json();
    await expect(
      solicitarRectificacion(marta, { campo: "NOMBRE", valor: "Marta R." }),
    ).rejects.toBeInstanceOf(ErrorConflicto);
    expect((await miPerfil(marta)).solicitudes[0]).toMatchObject({
      titulo: "Corregir el nombre",
      estado: "PENDIENTE",
    });

    expect(await verSolicitudArco(ana, id, LUNES)).toMatchObject({
      tipo: "RECTIFICACION",
      pendiente: true,
      antes: "Marta Rojas",
      nuevo: "Marta Rojas Paredes",
      detalle: "Falta mi segundo apellido",
      quien: "Marta Rojas · Mz. A, lote 12",
    });

    const aprobada = await resolverHttp(
      pedir(`/api/arco/solicitudes/${id}`, "PATCH", tokenAna, { aprobar: true }),
      {
        params: Promise.resolve({ id }),
      },
    );
    expect(aprobada.status).toBe(200);
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: marta.usuarioId } })).nombreCompleto).toBe(
      "Marta Rojas Paredes",
    );
    const auditoria = await prisma.registroAuditoria.findFirstOrThrow({ where: { entidadId: id } });
    expect(auditoria).toMatchObject({ accion: "aprobar_arco", actorId: ana.usuarioId });
    expect(await prisma.avisoEnCola.findMany({ where: { destinatarioId: marta.usuarioId } })).toEqual([
      expect.objectContaining({
        titulo: "Corregimos su dato",
        plantilla: "solicitud_privacidad",
        parametros: ["Marta", expect.stringMatching(/^S-\d{4}$/), "aprobada: el nombre ya está corregido"],
      }),
    ]);
    await expect(resolverSolicitudArco(ana, id, { aprobar: false, motivo: "x" })).rejects.toBeInstanceOf(
      ErrorConflicto,
    );
  });

  it("@HU-GAR-13 CA3 corregir la vivienda la mueve en el padrón; el DNI de otra persona no se acepta", async () => {
    const rosa = await vecino("40000007");
    const { id } = await solicitarRectificacion(rosa, { campo: "DIRECCION", valor: "b 11" }, LUNES);
    await resolverSolicitudArco(ana, id, { aprobar: true }, dias(1));
    const vive = await prisma.residencia.findFirstOrThrow({
      where: { usuarioId: rosa.usuarioId, fechaFin: null },
      include: { predio: true },
    });
    expect([vive.predio.manzana, vive.predio.lote, vive.relacion]).toEqual(["B", "11", "TITULAR"]);

    const otraCasa = await solicitarRectificacion(
      rosa,
      { campo: "DIRECCION", valor: "Mz. Z, lote 99" },
      LUNES,
    );
    await expect(resolverSolicitudArco(ana, otraCasa.id, { aprobar: true })).rejects.toBeInstanceOf(
      ErrorReglaNegocio,
    );

    const dni = await solicitarRectificacion(rosa, { campo: "DNI", valor: "40000008" }, LUNES);
    await expect(resolverSolicitudArco(ana, dni.id, { aprobar: true })).rejects.toBeInstanceOf(
      ErrorConflicto,
    );
    expect((await prisma.solicitudArco.findUniqueOrThrow({ where: { id: dni.id } })).estado).toBe(
      "PENDIENTE",
    );
  });

  it("@HU-GAR-16 CA3 rechazar exige el motivo y se lo envía al vecino", async () => {
    const { id } = await solicitarRectificacion(marta, { campo: "DNI", valor: "40000099" }, LUNES);
    await expect(resolverSolicitudArco(ana, id, { aprobar: false })).rejects.toBeInstanceOf(ErrorValidacion);
    await resolverSolicitudArco(
      ana,
      id,
      { aprobar: false, motivo: "El DNI no coincide con su documento" },
      dias(1),
    );
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: marta.usuarioId } })).dni).toBe("40000002");
    expect(
      (await prisma.registroAuditoria.findFirstOrThrow({ where: { entidadId: id } })).despues,
    ).toMatchObject({
      estado: "RECHAZADA",
      motivo: "El DNI no coincide con su documento",
    });
    const perfil = await miPerfil(marta);
    expect(perfil.solicitudes[0]).toMatchObject({
      estado: "RECHAZADA",
      motivo: "El DNI no coincide con su documento",
    });
  });
});

describe("@HU-GAR-16 Bandeja de solicitudes de privacidad", () => {
  it("@HU-GAR-16 CA1 CA2 muestra todas por tipo, con el plazo y la alerta de vencimiento", async () => {
    const rosa = await vecino("40000007");
    const vieja = await solicitarRectificacion(rosa, { campo: "NOMBRE", valor: "Rosa Díaz Paz" }, LUNES);
    await solicitarCopia(marta, dias(1));

    const bandeja = await bandejaArco(ana, undefined, dias(10));
    expect(bandeja.map((f) => f.tipo)).toEqual(["RECTIFICACION", "ACCESO"]);
    expect(bandeja[0]).toMatchObject({
      id: vieja.id,
      tipoTexto: "Rectificación",
      titulo: "Corregir el nombre",
      quien: "Rosa Díaz · Mz. B, lote 2",
      plazoTexto: "Van 8 de 10 días hábiles",
      insignia: { tipo: "aviso", texto: "Vence en 2 días hábiles" },
    });
    expect(bandeja[1]).toMatchObject({ insignia: { texto: "Resuelta sola" } });
    expect((await bandejaArco(ana, "ACCESO", dias(10))).map((f) => f.tipo)).toEqual(["ACCESO"]);
    expect((await bandejaArco(ana, undefined, dias(16)))[0].insignia).toEqual({
      tipo: "error",
      texto: "Venció el plazo",
    });
    expect(await resumenArco(ana, dias(10))).toEqual({ pendientes: 1, porVencer: 1 });

    await expect(bandejaArco(marta)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(resolverSolicitudArco(marta, vieja.id, { aprobar: true })).rejects.toBeInstanceOf(
      ErrorNoAutorizado,
    );
  });
});
