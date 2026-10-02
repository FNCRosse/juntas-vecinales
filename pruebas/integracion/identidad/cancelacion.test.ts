import { POST as solicitarHttp } from "@/app/api/arco/solicitudes/route";
import { PATCH as resolverHttp } from "@/app/api/arco/solicitudes/[id]/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorConflicto, ErrorValidacion } from "@/compartido/errores";
import { despacharAvisos } from "@/compartido/notificaciones/despachar";
import { crearSimulador } from "@/compartido/notificaciones/whatsapp";
import {
  bandejaArco,
  cambiarOposicion,
  miPerfil,
  prefiereUbicacionGeneralizada,
  resolverSolicitudArco,
  solicitarCancelacion,
  verSolicitudArco,
} from "@/modulos/identidad/aplicacion/arco";
import { consultar } from "@/modulos/identidad/aplicacion/garita";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import { obtenerSesion, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

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
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones, nucleo_preferencias_aviso CASCADE`;
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

describe("@HU-GAR-14 Cancelación de la cuenta", () => {
  it("@HU-GAR-14 CA1 CA2 pide la cancelación con su motivo; la cuenta sigue igual y la administración recibe el aviso", async () => {
    const respuesta = await solicitarHttp(
      pedir("/api/arco/solicitudes", "POST", tokenMarta, { tipo: "CANCELACION", motivo: "MUDANZA" }),
      undefined,
    );
    expect(respuesta.status).toBe(201);
    const { id, vence } = await respuesta.json();
    expect(vence).toMatch(/de 2026$/);
    expect(await prisma.solicitudArco.findUniqueOrThrow({ where: { id } })).toMatchObject({
      tipo: "CANCELACION",
      estado: "PENDIENTE",
      detalle: "Me mudé del barrio",
    });
    await expect(solicitarCancelacion(marta, { motivo: "OTRO" })).rejects.toBeInstanceOf(ErrorConflicto);
    expect(await obtenerSesion(tokenMarta)).not.toBeNull();
    expect((await miPerfil(marta)).cancelacionPendiente).toBe(true);
    expect(await prisma.avisoEnCola.findMany({ where: { destinatarioId: ana.usuarioId } })).toEqual([
      expect.objectContaining({
        plantilla: "cancelacion_pedida",
        parametros: ["Marta Rojas (Mz. A, lote 12)", vence],
      }),
    ]);
    expect(await verSolicitudArco(ana, id)).toMatchObject({
      titulo: "Cancelar su cuenta y sus datos",
      efecto: { seBorra: expect.arrayContaining(["DNI"]), seConserva: expect.any(Array) },
    });
  });

  it("@HU-GAR-14 CA3 al aprobarla se anonimiza en todos los módulos, se cierra la sesión y sale de la garita", async () => {
    const julio = await prisma.usuario.findUniqueOrThrow({ where: { dni: "40000006" } });
    const sesionJulio: SesionDto = {
      usuarioId: julio.id,
      nombreCompleto: julio.nombreCompleto,
      roles: julio.roles,
      politicaAceptada: true,
    };
    await prisma.perfilAccesibilidad.create({ data: { usuarioId: julio.id, modoSeniorActivo: true } });
    await prisma.solicitudApoyo.create({
      data: {
        usuarioId: julio.id,
        quien: "Julio Mendoza, Mz. A, lote 3",
        pantalla: "Inicio",
        modo: "LLAMADA",
      },
    });
    const correccion = await prisma.solicitudArco.create({
      data: {
        usuarioId: julio.id,
        tipo: "RECTIFICACION",
        campo: "NOMBRE",
        valorAnterior: "Julio Mendoza",
        valorNuevo: "Julio M.",
      },
    });
    const { id } = await solicitarCancelacion(
      sesionJulio,
      { motivo: "NO_DESEA", detalle: "Prefiero el papel" },
      LUNES,
    );

    await expect(resolverSolicitudArco(ana, id, { aprobar: false })).rejects.toBeInstanceOf(ErrorValidacion);
    const respuesta = await resolverHttp(
      pedir(`/api/arco/solicitudes/${id}`, "PATCH", tokenAna, { aprobar: true }),
      {
        params: Promise.resolve({ id }),
      },
    );
    expect(respuesta.status).toBe(200);

    const anonima = await prisma.usuario.findUniqueOrThrow({ where: { id: julio.id } });
    expect(anonima).toMatchObject({
      nombreCompleto: "Persona anonimizada",
      dni: `ANONIMO-${julio.id}`,
      telefonoWhatsApp: null,
      estado: "DESVINCULADA",
      roles: [],
      anonimizadaEn: expect.any(Date),
    });
    expect(await prisma.residencia.count({ where: { usuarioId: julio.id, fechaFin: null } })).toBe(0);
    expect(await prisma.perfilAccesibilidad.count({ where: { usuarioId: julio.id } })).toBe(0);
    expect(await prisma.solicitudApoyo.findFirstOrThrow({ where: { usuarioId: julio.id } })).toMatchObject({
      quien: "Persona anonimizada",
      detalle: null,
    });
    expect(await prisma.solicitudArco.findUniqueOrThrow({ where: { id: correccion.id } })).toMatchObject({
      valorAnterior: null,
      valorNuevo: null,
    });
    // Ya no aparece en la garita por su DNI ni por su nombre.
    const luis = (await iniciarSesionConClave({ dni: "40000004", clave: "clave-de-prueba" })).sesion;
    expect((await consultar(luis, "40000006")).resultados).toEqual([]);
    expect((await consultar(luis, "Julio")).resultados).toEqual([]);

    expect(await prisma.registroAuditoria.findFirstOrThrow({ where: { entidadId: id } })).toMatchObject({
      accion: "aprobar_arco",
      actorId: ana.usuarioId,
    });
    // El aviso final sale a su número de antes, sin copia interna; el worker borra el número al enviarlo.
    const [aviso] = await prisma.avisoEnCola.findMany({ where: { destinatarioId: julio.id } });
    expect(aviso).toMatchObject({
      telefono: "51900000006",
      conCopiaInterna: false,
      plantilla: "solicitud_privacidad",
    });
    await despacharAvisos(new Date(), crearSimulador({}));
    expect(await prisma.avisoEnCola.findUniqueOrThrow({ where: { id: aviso.id } })).toMatchObject({
      estado: "ENVIADA",
      telefono: null,
      parametros: [],
    });
    expect(await prisma.notificacion.count({ where: { destinatarioId: julio.id } })).toBe(0);
    expect((await bandejaArco(ana)).find((f) => f.id === id)).toMatchObject({
      quien: "Persona anonimizada",
      insignia: { texto: "Aprobada" },
    });
  });

  it("@HU-GAR-14 rechazarla deja la cuenta igual y le explica el motivo", async () => {
    const { id } = await solicitarCancelacion(marta, { motivo: "OTRO" });
    await resolverSolicitudArco(ana, id, { aprobar: false, motivo: "Tiene una deuda en revisión" });
    expect(await obtenerSesion(tokenMarta)).not.toBeNull();
    expect(
      await prisma.avisoEnCola.findFirstOrThrow({ where: { destinatarioId: marta.usuarioId } }),
    ).toMatchObject({
      titulo: "No cancelamos su cuenta",
      conCopiaInterna: true,
    });
  });
});

describe("@HU-GAR-15 Oposición a mostrar la ubicación exacta", () => {
  it("@HU-GAR-15 CA1 CA2 CA3 se activa sola, queda registrada y M3 la consulta; también se puede retirar", async () => {
    expect(await prefiereUbicacionGeneralizada(marta.usuarioId)).toBe(false);
    const respuesta = await solicitarHttp(
      pedir("/api/arco/solicitudes", "POST", tokenMarta, { tipo: "OPOSICION", activa: true }),
      undefined,
    );
    expect(await respuesta.json()).toEqual({ ocultaUbicacion: true });
    expect(await prefiereUbicacionGeneralizada(marta.usuarioId)).toBe(true);
    expect((await miPerfil(marta)).ocultaUbicacion).toBe(true);
    // Activarla dos veces no deja dos registros.
    await cambiarOposicion(marta, true);
    expect(
      await prisma.solicitudArco.count({ where: { usuarioId: marta.usuarioId, tipo: "OPOSICION" } }),
    ).toBe(1);

    await cambiarOposicion(marta, false);
    expect(await prefiereUbicacionGeneralizada(marta.usuarioId)).toBe(false);
    const bandeja = await bandejaArco(ana, "OPOSICION");
    expect(bandeja.map((f) => [f.titulo, f.insignia.texto])).toEqual([
      ["Volver a mostrar su ubicación exacta", "Resuelta sola"],
      ["No mostrar su ubicación exacta en el mapa", "Resuelta sola"],
    ]);
    expect(
      await prisma.registroAuditoria.count({
        where: {
          accion: { in: ["oponerse_ubicacion_exacta", "retirar_oposicion_ubicacion"] },
          actorId: marta.usuarioId,
        },
      }),
    ).toBe(2);
  });
});
