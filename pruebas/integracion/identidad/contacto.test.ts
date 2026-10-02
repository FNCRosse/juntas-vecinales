import { PATCH as resolverHttp } from "@/app/api/admin/contacto/[id]/route";
import { POST as pedirHttp } from "@/app/api/perfil/contacto/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorConflicto, ErrorNoEncontrado, ErrorValidacion } from "@/compartido/errores";
import { despacharAvisos } from "@/compartido/notificaciones/despachar";
import { crearSimulador } from "@/compartido/notificaciones/whatsapp";
import {
  miPerfil,
  resolverCambioDeNumero,
  resolverSolicitudArco,
  solicitarRectificacion,
  verSolicitudArco,
} from "@/modulos/identidad/aplicacion/arco";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { celularLegible, leerCelular } from "@/modulos/identidad/dominio/arco";

const LUNES = new Date("2026-10-05T15:00:00Z");
let ana: SesionDto;
let tokenAna: string;
let marta: SesionDto;
let tokenMarta: string;

const pedir = (ruta: string, metodo: string, token: string, cuerpo?: unknown) =>
  new Request(`http://localhost${ruta}`, {
    method: metodo,
    headers: { cookie: `sesion=${token}` },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones CASCADE`;
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

describe("@HU-GAR-17 Cambio de número verificado", () => {
  it("@HU-GAR-17 lee el celular como lo escribe la persona", () => {
    expect(leerCelular("987 654 321")).toBe("51987654321");
    expect(leerCelular("+51 987-654-321")).toBe("51987654321");
    expect(leerCelular("87654321")).toBeNull();
    expect(celularLegible("51987654321")).toBe("987 654 321");
  });

  it("@HU-GAR-17 CA1 el vecino pide el número nuevo y queda pendiente de verificación", async () => {
    const respuesta = await pedirHttp(
      pedir("/api/perfil/contacto", "POST", tokenMarta, {
        telefono: "945 876 123",
        detalle: "Cambié de teléfono",
      }),
      undefined,
    );
    expect(respuesta.status).toBe(201);
    const { id } = await respuesta.json();
    expect(await prisma.solicitudArco.findUniqueOrThrow({ where: { id } })).toMatchObject({
      campo: "WHATSAPP",
      estado: "PENDIENTE",
      valorAnterior: "51900000002",
      valorNuevo: "51945876123",
    });
    expect((await miPerfil(marta)).solicitudes[0]).toMatchObject({
      titulo: "Cambiar su número de WhatsApp",
      estadoTexto: "Pendiente de verificación",
    });
    expect(await verSolicitudArco(ana, id, LUNES)).toMatchObject({
      antes: "900 000 002",
      nuevo: "945 876 123",
      pideVerificacion: true,
    });

    const invalido = await pedirHttp(
      pedir("/api/perfil/contacto", "POST", tokenMarta, { telefono: "123" }),
      undefined,
    );
    expect(invalido.status).toBe(400);
    expect((await invalido.json()).campos).toEqual({ valor: "El celular tiene 9 números y empieza con 9." });
    await expect(
      solicitarRectificacion(marta, { campo: "WHATSAPP", valor: "900000002" }),
    ).rejects.toBeInstanceOf(ErrorValidacion);
    await expect(
      solicitarRectificacion(marta, { campo: "WHATSAPP", valor: "911111111" }),
    ).rejects.toBeInstanceOf(ErrorConflicto);
  });

  it("@HU-GAR-17 CA2 CA3 aprobar exige la verificación; cambia el número y avisa al anterior y al nuevo", async () => {
    const { id } = await solicitarRectificacion(marta, { campo: "WHATSAPP", valor: "945876123" }, LUNES);
    await expect(resolverCambioDeNumero(ana, id, { aprobar: true })).rejects.toMatchObject({
      campos: { verificacion: "Indique cómo se verificó su identidad antes de cambiar el número." },
    });

    const respuesta = await resolverHttp(
      pedir(`/api/admin/contacto/${id}`, "PATCH", tokenAna, { aprobar: true, verificacion: "DIRECTIVA" }),
      { params: Promise.resolve({ id }) },
    );
    expect(respuesta.status).toBe(200);
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: marta.usuarioId } })).telefonoWhatsApp,
    ).toBe("51945876123");
    expect(await prisma.solicitudArco.findUniqueOrThrow({ where: { id } })).toMatchObject({
      estado: "APROBADA",
      verificacion: "La directiva verificó su identidad en su casa",
    });
    expect(
      (await prisma.registroAuditoria.findFirstOrThrow({ where: { entidadId: id } })).despues,
    ).toMatchObject({
      verificacion: "La directiva verificó su identidad en su casa",
    });

    const avisos = await prisma.avisoEnCola.findMany({
      where: { destinatarioId: marta.usuarioId },
      orderBy: { telefono: "desc" },
    });
    expect(avisos).toEqual([
      expect.objectContaining({
        tipo: "SEGURIDAD",
        telefono: "51945876123",
        plantilla: "numero_cambiado",
        parametros: ["Marta", "123"],
        conCopiaInterna: true,
      }),
      expect.objectContaining({
        telefono: "51900000002",
        plantilla: "numero_cambiado",
        conCopiaInterna: false,
      }),
    ]);
    // Los dos WhatsApp salen, pero en su centro de avisos queda una sola copia.
    expect(await despacharAvisos(new Date(), crearSimulador({}))).toMatchObject({ enviados: 2 });
    expect(await prisma.notificacion.findMany({ where: { destinatarioId: marta.usuarioId } })).toEqual([
      expect.objectContaining({ titulo: "Cambiamos su número de WhatsApp" }),
    ]);
  });

  it("@HU-GAR-17 CA2 rechazar no cambia el número; la ruta de contacto no resuelve otras solicitudes", async () => {
    const { id } = await solicitarRectificacion(marta, { campo: "WHATSAPP", valor: "945876123" }, LUNES);
    await resolverSolicitudArco(ana, id, { aprobar: false, motivo: "No pudimos verificar su identidad" });
    expect(
      (await prisma.usuario.findUniqueOrThrow({ where: { id: marta.usuarioId } })).telefonoWhatsApp,
    ).toBe("51900000002");
    expect(await prisma.avisoEnCola.findMany({ where: { destinatarioId: marta.usuarioId } })).toEqual([
      expect.objectContaining({ telefono: "51900000002", plantilla: "solicitud_privacidad" }),
    ]);

    const nombre = await solicitarRectificacion(marta, { campo: "NOMBRE", valor: "Marta Rojas Paredes" });
    await expect(resolverCambioDeNumero(ana, nombre.id, { aprobar: true })).rejects.toBeInstanceOf(
      ErrorNoEncontrado,
    );
  });
});
