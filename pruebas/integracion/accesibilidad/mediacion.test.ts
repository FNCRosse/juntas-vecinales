import { POST as pedirHttp } from "@/app/api/accesibilidad/mediacion/route";
import { PATCH as estadoHttp } from "@/app/api/accesibilidad/mediacion/[id]/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorReglaNegocio } from "@/compartido/errores";
import {
  cambiarEstadoApoyo,
  misSolicitudes,
  solicitudesPorAtender,
} from "@/modulos/accesibilidad/aplicacion/mediacion";
import { puedePasarA, numeroDePedido } from "@/modulos/accesibilidad/dominio/canalMediacionHumana";
import { contactoDeAdministracion, mediadoresDeTurno } from "@/modulos/identidad/aplicacion/datosParaAyuda";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";

const CLAVE = "clave-de-prueba";
const pedir = (token: string, metodo: string, cuerpo: unknown) =>
  new Request("http://localhost/api", {
    method: metodo,
    headers: { cookie: `sesion=${token}` },
    body: JSON.stringify(cuerpo),
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, accesibilidad_solicitudes_apoyo CASCADE`;
  await sembrar(CLAVE);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-ACC-04 Pedir ayuda humana desde cualquier pantalla", () => {
  it("@HU-ACC-04 CA2 CA3 registra quién pide y en qué pantalla, pendiente, y avisa al mediador de turno", async () => {
    // Marta es directiva y vecina de Mz. A, lote 12.
    const { token, sesion } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE });
    const respuesta = await pedirHttp(
      pedir(token, "POST", { pantalla: "Mi cuota", modo: "VISITA", detalle: " No veo mi recibo " }),
      undefined,
    );
    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toMatchObject({
      numero: expect.stringMatching(/^A-\d{3}$/),
      quien: "Marta Rojas, Mz. A, lote 12",
      pantalla: "Mi cuota",
      modo: "Que me visiten en mi casa",
      detalle: "No veo mi recibo",
      estado: "PENDIENTE",
      atiende: "Pedro Chávez",
      promesa: "le visitará en su casa",
    });
    expect(await prisma.avisoEnCola.findFirstOrThrow({ where: { plantilla: "pedido_ayuda" } })).toMatchObject(
      {
        telefono: "51900000003",
        parametros: ["Marta Rojas, Mz. A, lote 12", "Mi cuota", "Que me visiten en mi casa"],
      },
    );
    expect((await misSolicitudes(sesion.usuarioId)).map((s) => s.estadoTexto)).toEqual(["Pendiente"]);
  });

  it("@HU-ACC-04 CA3 el mediador la atiende: pendiente, en atención, atendida; no vuelve atrás", async () => {
    const { token: tokenMarta, sesion: marta } = await iniciarSesionConClave({
      dni: "40000002",
      clave: CLAVE,
    });
    const { id } = await (
      await pedirHttp(pedir(tokenMarta, "POST", { pantalla: "Inicio", modo: "LLAMADA" }), undefined)
    ).json();
    const { token: tokenPedro, sesion: pedro } = await iniciarSesionConClave({
      dni: "40000003",
      clave: CLAVE,
    });
    const actor = { usuarioId: pedro.usuarioId, nombre: pedro.nombreCompleto, roles: pedro.roles };

    expect((await solicitudesPorAtender(actor)).map((s) => s.quien)).toEqual(["Marta Rojas, Mz. A, lote 12"]);
    const enAtencion = await estadoHttp(pedir(tokenPedro, "PATCH", { estado: "EN_ATENCION" }), {
      params: Promise.resolve({ id }),
    });
    expect(await enAtencion.json()).toMatchObject({ estado: "EN_ATENCION", estadoTexto: "En atención" });
    await cambiarEstadoApoyo(actor, id, "ATENDIDA");
    expect((await misSolicitudes(marta.usuarioId))[0].estadoTexto).toBe("Atendido por Pedro Chávez");
    await expect(cambiarEstadoApoyo(actor, id, "EN_ATENCION")).rejects.toBeInstanceOf(ErrorReglaNegocio);

    // Un vigilante no atiende pedidos de ayuda.
    const { sesion: luis } = await iniciarSesionConClave({ dni: "40000004", clave: CLAVE });
    await expect(
      solicitudesPorAtender({ usuarioId: luis.usuarioId, nombre: luis.nombreCompleto, roles: luis.roles }),
    ).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });

  it("@HU-ACC-04 CA2 sin mediador activo avisa a la directiva; el equipo pide ayuda a la administración", async () => {
    await prisma.usuario.update({ where: { dni: "40000003" }, data: { estado: "DESVINCULADA" } });
    expect((await mediadoresDeTurno()).map((m) => m.nombre)).toEqual(["Marta Rojas"]);
    expect(await contactoDeAdministracion()).toEqual({ nombre: "Ana Flores", telefono: "900 000 001" });
  });

  it("@HU-ACC-04 CA3 el estado solo avanza y el número se lee como A-013", () => {
    expect(puedePasarA("PENDIENTE", "ATENDIDA")).toBe(true);
    expect(puedePasarA("ATENDIDA", "PENDIENTE")).toBe(false);
    expect(numeroDePedido(13)).toBe("A-013");
  });
});
