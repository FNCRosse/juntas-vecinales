import { randomUUID } from "node:crypto";
import { GET as descargarHttp } from "@/app/api/archivos/[id]/route";
import { POST as pedirSubidaHttp } from "@/app/api/archivos/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";

const R2 = {
  R2_ID_CUENTA: "cuenta-de-prueba",
  R2_BUCKET: "juntas-vecinales-archivos",
  R2_ID_CLAVE_ACCESO: "clave-de-prueba",
  R2_CLAVE_ACCESO_SECRETA: "secreto-de-prueba",
};
const MB = 1024 * 1024;
let tokenMarta: string;
let tokenPedro: string;

const pedir = (url: string, metodo: string, cookie?: string, cuerpo?: unknown) =>
  new Request(`http://localhost${url}`, {
    method: metodo,
    headers: cookie ? { cookie: `sesion=${cookie}` } : {},
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

const subida = (cookie: string | undefined, cuerpo: unknown) =>
  pedirSubidaHttp(pedir("/api/archivos", "POST", cookie, cuerpo), undefined);

beforeAll(() => {
  Object.assign(process.env, R2);
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios CASCADE`;
  await prisma.$executeRaw`TRUNCATE nucleo_archivos CASCADE`;
  await sembrar("clave-de-prueba");
  ({ token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: "clave-de-prueba" }));
  // Pedro es directivo mediador: también es de la directiva.
  ({ token: tokenPedro } = await iniciarSesionConClave({ dni: "40000003", clave: "clave-de-prueba" }));
});

afterAll(async () => {
  for (const clave of Object.keys(R2)) delete process.env[clave];
  await prisma.$disconnect();
});

describe("@HU-ASA-10 Archivos con URL firmada (comprobantes de los gastos)", () => {
  it("@HU-ASA-10 CA1 la directiva pide subir la foto de un comprobante y recibe una URL firmada de 5 minutos", async () => {
    const respuesta = await subida(tokenMarta, {
      uso: "comprobante_egreso",
      tipo: "image/jpeg",
      tamano: 2 * MB,
    });
    expect(respuesta.status).toBe(201);
    const cuerpo = await respuesta.json();
    expect(cuerpo).toMatchObject({ metodo: "PUT", cabeceras: { "content-type": "image/jpeg" } });
    expect(new URL(cuerpo.url).host).toBe("cuenta-de-prueba.r2.cloudflarestorage.com");
    expect(new URL(cuerpo.url).searchParams.get("X-Amz-Expires")).toBe("300");
    const fila = await prisma.archivo.findUniqueOrThrow({ where: { id: cuerpo.id } });
    expect(fila).toMatchObject({ uso: "comprobante_egreso", tipo: "image/jpeg", tamano: 2 * MB });
    expect(fila.clave).toMatch(/^comprobantes\/[0-9a-f-]{36}\.jpg$/);
  });

  it("@HU-ASA-10 el tipo y el tamaño se validan en el servidor, con mensajes que dicen qué hacer", async () => {
    const tipo = await subida(tokenMarta, {
      uso: "comprobante_egreso",
      tipo: "application/zip",
      tamano: 1000,
    });
    expect(tipo.status).toBe(400);
    expect((await tipo.json()).campos.archivo).toBe(
      "Este archivo no se puede subir. Elija una foto (JPG o PNG) o un PDF.",
    );
    const grande = await subida(tokenMarta, { uso: "comprobante_egreso", tipo: "image/png", tamano: 6 * MB });
    expect((await grande.json()).campos.archivo).toContain("pesa más de 5 MB");
    expect(await prisma.archivo.count()).toBe(0);
  });

  it("@HU-ASA-10 solo la directiva pide la subida: el administrador recibe 403 y sin sesión 401", async () => {
    const { token } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" });
    expect((await subida(token, { uso: "comprobante_egreso", tipo: "image/png", tamano: 1000 })).status).toBe(
      403,
    );
    expect(
      (await subida(undefined, { uso: "comprobante_egreso", tipo: "image/png", tamano: 1000 })).status,
    ).toBe(401);
    expect((await subida(tokenMarta, { uso: "otro", tipo: "image/png", tamano: 1000 })).status).toBe(400);
  });

  it("@HU-ASA-10 AC-7 la descarga se firma solo para quien puede verlo; los demás reciben 404", async () => {
    const { id } = await (
      await subida(tokenMarta, { uso: "comprobante_egreso", tipo: "application/pdf", tamano: 1000 })
    ).json();
    const propia = await descargarHttp(pedir(`/api/archivos/${id}`, "GET", tokenMarta), {
      params: Promise.resolve({ id }),
    });
    expect(propia.status).toBe(302);
    const destino = new URL(propia.headers.get("location") ?? "");
    expect(destino.host).toBe("cuenta-de-prueba.r2.cloudflarestorage.com");
    expect(destino.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(propia.headers.get("cache-control")).toBe("private, no-store");

    // Otro miembro de la directiva también lo ve.
    expect(
      (
        await descargarHttp(pedir(`/api/archivos/${id}`, "GET", tokenPedro), {
          params: Promise.resolve({ id }),
        })
      ).status,
    ).toBe(302);

    // Alguien sin rol de directiva (el vigilante), un id inexistente y una petición sin sesión: no hay archivo.
    const { token: tokenVigilante } = await iniciarSesionConClave({
      dni: "40000004",
      clave: "clave-de-prueba",
    });
    for (const [cookie, ruta] of [
      [tokenVigilante, id],
      [tokenMarta, randomUUID()],
    ] as const) {
      const r = await descargarHttp(pedir(`/api/archivos/${ruta}`, "GET", cookie), {
        params: Promise.resolve({ id: ruta }),
      });
      expect(r.status).toBe(404);
    }
    const sinSesion = await descargarHttp(pedir(`/api/archivos/${id}`, "GET"), {
      params: Promise.resolve({ id }),
    });
    expect(sinSesion.status).toBe(401);
  });
});
