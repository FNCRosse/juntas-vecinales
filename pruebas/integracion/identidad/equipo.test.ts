import { POST as agregarHttp } from "@/app/api/admin/cuentas/route";
import { DELETE as quitarHttp } from "@/app/api/admin/cuentas/[usuarioId]/route";
import { POST as enlaceHttp } from "@/app/api/admin/cuentas/[usuarioId]/enlace/route";
import { PATCH as rolHttp } from "@/app/api/admin/cuentas/[usuarioId]/rol/route";
import { POST as buscarHttp } from "@/app/api/admin/cuentas/buscar/route";
import { POST as crearAccesoHttp } from "@/app/api/auth/equipo/crear/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import {
  ErrorConflicto,
  ErrorNoAutorizado,
  ErrorNoEncontrado,
  ErrorReglaNegocio,
} from "@/compartido/errores";
import {
  agregarAlEquipo,
  cambiarRol,
  consultarInvitacion,
  crearAccesoEquipo,
  diferenciaDePermisos,
  generarEnlaceDeInvitacion,
  listarEquipo,
  quitarAcceso,
} from "@/modulos/identidad/aplicacion/equipo";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import { obtenerSesion, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

jest.mock("next/server", () => ({ after: jest.fn() }));

const CLAVE = "clave-de-prueba";
const ORIGEN = "https://jv.ejemplo";
const T0 = new Date("2026-10-05T15:00:00Z");
const horas = (h: number) => new Date(T0.getTime() + h * 3_600_000);

let ana: SesionDto;
let tokenAna: string;
const idDe = async (dni: string) => (await prisma.usuario.findUniqueOrThrow({ where: { dni } })).id;
const invitacionEnCola = async () => {
  const aviso = await prisma.avisoEnCola.findFirstOrThrow({
    where: { plantilla: "invitacion_equipo" },
    orderBy: { creadoEn: "desc" },
  });
  return aviso.parametros[2].replace(/^.*\/entrar\/equipo\/crear\//, "");
};
const pedir = (metodo: string, cuerpo: unknown, cookie = `sesion=${tokenAna}`) =>
  new Request("http://localhost/api", { method: metodo, headers: { cookie }, body: JSON.stringify(cuerpo) });
const conId = (usuarioId: string) => ({ params: Promise.resolve({ usuarioId }) });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos CASCADE`;
  await sembrar(CLAVE);
  ({ sesion: ana, token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: CLAVE }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-21 Crear cuentas internas con rol", () => {
  it("@HU-GAR-21 CA1 lista el equipo con su rol y la matriz de permisos por rol", async () => {
    const equipo = await listarEquipo(ana);
    expect(equipo.map((m) => [m.nombre, m.rolTexto, m.gestionable, m.esUsted])).toEqual([
      ["Ana Flores", "Administración", false, true],
      ["Luis Paredes", "Vigilante", true, false],
      ["Marta Rojas", "Directiva", true, false],
      ["Pedro Chávez", "Directivo mediador", true, false],
    ]);
    expect(equipo.find((m) => m.nombre === "Marta Rojas")?.vivienda).toBe("Mz. A, lote 12");
  });

  it("@HU-GAR-21 CA1 CA2 CA3 a alguien del padrón: toma sus datos, le envía la invitación y queda auditado", async () => {
    const buscada = await buscarHttp(pedir("POST", { dni: "40000007" }), undefined);
    const rosa = await buscada.json();
    expect(rosa).toMatchObject({ nombre: "Rosa Díaz", vivienda: "Mz. B, lote 2", dniTerminadoEn: "07" });

    const agregado = await agregarAlEquipo(ana, { usuarioId: rosa.usuarioId }, "VIGILANTE", ORIGEN, T0);
    expect(agregado).toMatchObject({ nombre: "Rosa Díaz", rolTexto: "Vigilante", whatsapp: "900 000 007" });
    expect(agregado.invitacionVence).toBe(horas(48).toISOString());
    const usuaria = await prisma.usuario.findUniqueOrThrow({ where: { dni: "40000007" } });
    expect(usuaria.roles.sort()).toEqual(["VECINO", "VIGILANTE"]);

    const aviso = await prisma.avisoEnCola.findFirstOrThrow({ where: { plantilla: "invitacion_equipo" } });
    expect(aviso).toMatchObject({
      telefono: "51900000007",
      parametros: ["Rosa", "Vigilante", expect.any(String)],
    });
    expect(await consultarInvitacion(await invitacionEnCola(), horas(47))).toEqual({
      nombre: "Rosa",
      dni: "40000007",
      rolTexto: "Vigilante",
    });
    expect(await consultarInvitacion(await invitacionEnCola(), horas(48))).toBeNull();

    const registro = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "dar_acceso_equipo", entidadId: usuaria.id },
    });
    expect(registro).toMatchObject({
      actorId: ana.usuarioId,
      despues: { rol: "VIGILANTE", deAfuera: false },
    });
  });

  it("@HU-GAR-21 CA2 la persona crea su clave de equipo (12 o más) con la invitación y entra con su rol", async () => {
    await agregarAlEquipo(
      ana,
      { nombreCompleto: "Raúl Vega", dni: "41234567", telefono: "912345601" },
      "VIGILANTE",
      ORIGEN,
      T0,
    );
    const token = await invitacionEnCola();

    const corta = await crearAccesoHttp(pedir("POST", { token, clave: "corta-11ch" }, ""), undefined);
    expect(corta.status).toBe(400);
    const lista = await crearAccesoHttp(
      pedir("POST", { token, clave: "una-clave-de-equipo" }, ""),
      undefined,
    );
    expect(lista.status).toBe(200);
    expect(await lista.json()).toEqual({ destino: "/garita" });
    await expect(
      iniciarSesionConClave({ dni: "41234567", clave: "una-clave-de-equipo" }),
    ).resolves.toMatchObject({
      sesion: { roles: ["VIGILANTE"] },
    });
    // La invitación sirve una sola vez.
    await expect(crearAccesoEquipo(token, "otra-clave-de-equipo", undefined)).rejects.toBeInstanceOf(
      ErrorConflicto,
    );
  });

  it("@HU-GAR-21 CA2 el administrador genera un enlace para copiar: sirve una vez, anula el anterior y no se guarda", async () => {
    await agregarAlEquipo(
      ana,
      { nombreCompleto: "Raúl Vega", dni: "41234567", telefono: "912345601" },
      "DIRECTIVA",
      ORIGEN,
      T0,
    );
    const antes = await invitacionEnCola();
    const raul = await idDe("41234567");

    const r = await enlaceHttp(pedir("POST", {}), conId(raul));
    expect(r.status).toBe(201);
    expect(r.headers.get("cache-control")).toBe("no-store");
    const { enlace, nombre, vence } = await r.json();
    expect(nombre).toBe("Raúl Vega");
    expect(enlace).toMatch(/^http:\/\/localhost\/entrar\/equipo\/crear\/[A-Za-z0-9_-]{20,}$/);
    expect(new Date(vence).getTime()).toBeGreaterThan(Date.now());
    const token = enlace.replace(/^.*\/crear\//, "");

    // Nada guarda el enlace: ni la cola de avisos ni la auditoría.
    expect(JSON.stringify(await prisma.avisoEnCola.findMany())).not.toContain(token);
    const registro = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "generar_enlace_equipo", entidadId: raul },
    });
    expect(registro.actorId).toBe(ana.usuarioId);
    expect(JSON.stringify(registro)).not.toContain(token);

    // La invitación que ya estaba en la cola dejó de servir; la nueva sí, y una sola vez.
    expect(await consultarInvitacion(antes)).toBeNull();
    expect(await consultarInvitacion(token)).toMatchObject({ nombre: "Raúl", rolTexto: "Directiva" });
    await crearAccesoEquipo(token, "una-clave-de-equipo", undefined);
    await expect(crearAccesoEquipo(token, "otra-clave-de-equipo", undefined)).rejects.toBeInstanceOf(
      ErrorConflicto,
    );
    // Ya creó su acceso: no se genera otro enlace.
    await expect(generarEnlaceDeInvitacion(ana, raul, ORIGEN)).rejects.toBeInstanceOf(ErrorReglaNegocio);
  });

  it("@HU-GAR-21 solo la administración genera el enlace, y solo de quien es del equipo", async () => {
    const { sesion: marta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE });
    await expect(generarEnlaceDeInvitacion(marta, await idDe("40000003"), ORIGEN)).rejects.toBeInstanceOf(
      ErrorNoAutorizado,
    );
    await expect(generarEnlaceDeInvitacion(ana, await idDe("08123478"), ORIGEN)).rejects.toBeInstanceOf(
      ErrorNoEncontrado,
    );
    await expect(generarEnlaceDeInvitacion(ana, ana.usuarioId, ORIGEN)).rejects.toBeInstanceOf(
      ErrorNoEncontrado,
    );
  });

  it("@HU-GAR-21 no duplica: quien ya es del equipo o un DNI que ya existe", async () => {
    await expect(
      agregarAlEquipo(ana, { usuarioId: await idDe("40000002") }, "VIGILANTE", ORIGEN),
    ).rejects.toBeInstanceOf(ErrorReglaNegocio);
    const repetido = await agregarHttp(
      pedir("POST", {
        persona: { tipo: "afuera", nombreCompleto: "Otra", dni: "40000006", telefono: "912345678" },
        rol: "VIGILANTE",
      }),
      undefined,
    );
    expect(repetido.status).toBe(400);
    expect((await repetido.json()).campos).toEqual({
      "persona.dni": "Este DNI ya está en la plataforma. Elija «Sí, ya está en el padrón» y búsquelo.",
    });
    const incompleto = await agregarHttp(
      pedir("POST", { persona: { tipo: "afuera", nombreCompleto: "", dni: "1", telefono: "1" }, rol: "X" }),
      undefined,
    );
    expect(Object.keys((await incompleto.json()).campos).sort()).toEqual([
      "persona.dni",
      "persona.nombreCompleto",
      "persona.telefono",
      "rol",
    ]);
    expect((await buscarHttp(pedir("POST", { dni: "40000002" }), undefined)).status).toBe(200);
    expect((await buscarHttp(pedir("POST", { dni: "40000004" }), undefined)).status).toBe(404);
  });

  it("@HU-GAR-21 solo la administración gestiona el equipo", async () => {
    const { sesion: marta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE });
    await expect(listarEquipo(marta)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(cambiarRol(marta, await idDe("40000004"), "DIRECTIVA")).rejects.toBeInstanceOf(
      ErrorNoAutorizado,
    );
    // La cuenta de administración no se gestiona desde aquí.
    await expect(quitarAcceso(ana, ana.usuarioId, "OTRO")).rejects.toBeInstanceOf(ErrorNoEncontrado);
  });
});

describe("@HU-GAR-23 Reasignar el rol", () => {
  it("@HU-GAR-23 CA1 CA2 CA3 cambia el rol con la misma cuenta, los permisos cambian al instante y queda el rol anterior", async () => {
    const { token: tokenPedro } = await iniciarSesionConClave({ dni: "40000003", clave: CLAVE });
    const pedro = await idDe("40000003");
    const respuesta = await rolHttp(pedir("PATCH", { rol: "DIRECTIVA" }), conId(pedro));
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ nombre: "Pedro Chávez", rolTexto: "Directiva" });
    // Misma sesión, permisos nuevos.
    expect(await obtenerSesion(tokenPedro)).toMatchObject({ roles: ["DIRECTIVA"] });
    expect(
      await prisma.registroAuditoria.findFirstOrThrow({ where: { accion: "cambiar_rol", entidadId: pedro } }),
    ).toMatchObject({
      actorId: ana.usuarioId,
      antes: { rol: "DIRECTIVO_MEDIADOR" },
      despues: { rol: "DIRECTIVA" },
    });
    expect(await prisma.avisoEnCola.findFirstOrThrow({ where: { plantilla: "rol_cambiado" } })).toMatchObject(
      {
        parametros: ["Pedro", "Directiva"],
      },
    );
    // A una vecina de la directiva, cambiarle el rol no le quita ser vecina.
    await cambiarRol(ana, await idDe("40000002"), "DIRECTIVO_MEDIADOR");
    expect((await prisma.usuario.findUniqueOrThrow({ where: { dni: "40000002" } })).roles.sort()).toEqual([
      "DIRECTIVO_MEDIADOR",
      "VECINO",
    ]);
    await expect(cambiarRol(ana, pedro, "DIRECTIVA")).rejects.toThrow("Es el mismo rol que tiene hoy");
  });

  it("@HU-GAR-23 CA2 lo que gana, pierde y mantiene", () => {
    expect(diferenciaDePermisos("DIRECTIVA", "DIRECTIVO_MEDIADOR")).toEqual({
      gana: [],
      pierde: [
        "Revisar pagos, cobrar en efectivo y emitir recibos",
        "Cambiar la tarifa de la cuota",
        "Convocar asambleas, pasar lista y publicar actas",
        "Evaluar, resolver y derivar incidentes",
      ],
      mantiene: ["Registrar por un vecino y atender pedidos de ayuda"],
    });
  });
});

describe("@HU-GAR-22 Revocar el acceso", () => {
  it("@HU-GAR-22 CA1 CA2 CA3 a alguien de afuera: cuenta desactivada, sesiones cerradas y motivo auditado", async () => {
    const { token: tokenLuis } = await iniciarSesionConClave({ dni: "40000004", clave: CLAVE });
    const luis = await idDe("40000004");
    const respuesta = await quitarHttp(pedir("DELETE", { motivo: "CONTRATO" }), conId(luis));
    expect(await respuesta.json()).toEqual({ nombre: "Luis Paredes", sigueSiendoVecino: false });
    expect(await obtenerSesion(tokenLuis)).toBeNull();
    expect((await prisma.usuario.findUniqueOrThrow({ where: { id: luis } })).estado).toBe("DESVINCULADA");
    await expect(iniciarSesionConClave({ dni: "40000004", clave: CLAVE })).rejects.toThrow();
    expect(
      await prisma.registroAuditoria.findFirstOrThrow({
        where: { accion: "quitar_acceso_equipo", entidadId: luis },
      }),
    ).toMatchObject({
      actorId: ana.usuarioId,
      despues: { motivo: "Terminó su contrato", estado: "DESVINCULADA" },
    });
  });

  it("@HU-GAR-22 CA2 a una vecina de la directiva: pierde el rol y sus sesiones, pero sigue siendo vecina", async () => {
    const { token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE });
    const marta = await idDe("40000002");
    expect(await quitarAcceso(ana, marta, "CARGO")).toEqual({
      nombre: "Marta Rojas",
      sigueSiendoVecino: true,
    });
    expect(await obtenerSesion(tokenMarta)).toBeNull();
    const cuenta = await prisma.usuario.findUniqueOrThrow({ where: { id: marta } });
    expect([cuenta.estado, cuenta.roles]).toEqual(["ACTIVA", ["VECINO"]]);
  });

  it("@HU-GAR-22 quitar el acceso anula la invitación pendiente", async () => {
    await agregarAlEquipo(ana, { usuarioId: await idDe("40000008") }, "VIGILANTE", ORIGEN, T0);
    const token = await invitacionEnCola();
    await quitarAcceso(ana, await idDe("40000008"), "OTRO", horas(1));
    expect(await consultarInvitacion(token, horas(2))).toBeNull();
    expect((await quitarHttp(pedir("DELETE", { motivo: "NADA" }), conId("x"))).status).toBe(400);
  });
});
