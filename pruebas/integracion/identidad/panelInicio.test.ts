import { GET as inicioHttp } from "@/app/api/portal/inicio/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { despacharAvisos } from "@/compartido/notificaciones/despachar";
import { encolarAviso } from "@/compartido/notificaciones/encolar";
import { crearSimulador } from "@/compartido/notificaciones/whatsapp";
import { marcarTodosLeidos } from "@/modulos/identidad/aplicacion/avisos";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos CASCADE`;
  await sembrar("clave-de-prueba");
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-19 Panel de inicio consolidado", () => {
  it("@HU-GAR-19 CA1 CA3 el bloque de M1 trae el saludo, la vivienda y los avisos sin leer, al día", async () => {
    const { token, sesion } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" });
    const pedir = () =>
      inicioHttp(
        new Request("http://localhost/api/portal/inicio", { headers: { cookie: `sesion=${token}` } }),
        undefined,
      );
    expect(await (await pedir()).json()).toEqual({
      identidad: { nombre: "Marta", vivienda: "Mz. A, lote 12", avisosSinLeer: 0 },
    });

    await prisma.$transaction((tx) =>
      encolarAviso(
        { destinatarioId: sesion.usuarioId, tipo: "ASAMBLEAS", titulo: "Asamblea", texto: "Sábado." },
        tx,
      ),
    );
    await despacharAvisos(new Date(), crearSimulador({}));
    expect((await (await pedir()).json()).identidad.avisosSinLeer).toBe(1);
    await marcarTodosLeidos(sesion);
    expect((await (await pedir()).json()).identidad.avisosSinLeer).toBe(0);

    const sinSesion = await inicioHttp(new Request("http://localhost/api/portal/inicio"), undefined);
    expect(sinSesion.status).toBe(401);
  });
});
