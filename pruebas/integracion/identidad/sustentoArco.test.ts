import { randomUUID } from "node:crypto";
import { GET as descargarHttp } from "@/app/api/archivos/[id]/route";
import { POST as pedirSubidaHttp } from "@/app/api/archivos/route";
import { POST as solicitarHttp } from "@/app/api/arco/solicitudes/route";
import { POST as contactoHttp } from "@/app/api/perfil/contacto/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { solicitarRectificacion, verSolicitudArco } from "@/modulos/identidad/aplicacion/arco";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const R2 = {
  R2_ID_CUENTA: "cuenta-de-prueba",
  R2_BUCKET: "juntas-vecinales-archivos",
  R2_ID_CLAVE_ACCESO: "clave-de-prueba",
  R2_CLAVE_ACCESO_SECRETA: "secreto-de-prueba",
};
const MENSAJE =
  "El documento tiene que ser una foto o un PDF de hasta 5 MB. Si no puede subirlo, envíe la solicitud sin él.";

let ana: SesionDto;
let marta: SesionDto;
let tokenAna: string;
let tokenMarta: string;
let tokenPedro: string;

const pedir = (url: string, metodo: string, token: string | undefined, cuerpo?: unknown) =>
  new Request(`http://localhost${url}`, {
    method: metodo,
    headers: token ? { cookie: `sesion=${token}` } : {},
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

/** Un documento ya subido por esa persona, como lo deja la subida firmada. */
const sustentoDe = async (quien: SesionDto, uso = "sustento_arco") =>
  (
    await prisma.archivo.create({
      data: {
        clave: `comprobantes/${randomUUID()}.jpg`,
        tipo: "image/jpeg",
        tamano: 1000,
        uso,
        subidoPor: quien.usuarioId,
      },
    })
  ).id;

beforeAll(() => {
  Object.assign(process.env, R2);
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_archivos, identidad_solicitudes_arco, nucleo_cola_avisos CASCADE`;
  await sembrar("clave-de-prueba");
  ({ sesion: ana, token: tokenAna } = await iniciarSesionConClave({
    dni: "40000001",
    clave: "clave-de-prueba",
  }));
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({
    dni: "40000002",
    clave: "clave-de-prueba",
  }));
  ({ token: tokenPedro } = await iniciarSesionConClave({ dni: "40000003", clave: "clave-de-prueba" }));
});

afterAll(async () => {
  for (const clave of Object.keys(R2)) delete process.env[clave];
  await prisma.$disconnect();
});

describe("@HU-GAR-13 CA1 El sustento documental de la corrección", () => {
  it("@HU-GAR-13 CA1 la vecina adjunta la foto de su DNI y la administración la ve en la ficha", async () => {
    const sustento = await sustentoDe(marta);
    const { id } = await solicitarRectificacion(marta, {
      campo: "NOMBRE",
      valor: "Marta Rojas Díaz",
      sustentoId: sustento,
    });
    expect((await prisma.solicitudArco.findUniqueOrThrow({ where: { id } })).sustentoId).toBe(sustento);
    expect(await verSolicitudArco(ana, id)).toMatchObject({ sustento: { id: sustento } });
  });

  it("@HU-GAR-13 CA1 el documento es opcional: sin él, la ficha dice que no hay", async () => {
    const { id } = await solicitarRectificacion(marta, { campo: "NOMBRE", valor: "Marta Rojas Díaz" });
    expect(await verSolicitudArco(ana, id)).toMatchObject({ sustento: null });
  });

  it("@HU-GAR-13 CA1 también se adjunta al pedir el cambio de número", async () => {
    const sustento = await sustentoDe(marta);
    const { id } = await solicitarRectificacion(marta, {
      campo: "WHATSAPP",
      valor: "987 654 329",
      sustentoId: sustento,
    });
    expect(await verSolicitudArco(ana, id)).toMatchObject({
      campo: "el número de WhatsApp",
      sustento: { id: sustento },
    });
  });

  it("@HU-GAR-13 CA1 un documento que no subió ella, o que es para otra cosa, no se acepta", async () => {
    await expect(
      solicitarRectificacion(marta, {
        campo: "NOMBRE",
        valor: "Marta Rojas Díaz",
        sustentoId: await sustentoDe(ana),
      }),
    ).rejects.toMatchObject({ campos: { sustento: MENSAJE } });
    await expect(
      solicitarRectificacion(marta, {
        campo: "NOMBRE",
        valor: "Marta Rojas Díaz",
        sustentoId: await sustentoDe(marta, "comprobante_pago"),
      }),
    ).rejects.toMatchObject({ campos: { sustento: MENSAJE } });
    await expect(
      solicitarRectificacion(marta, { campo: "NOMBRE", valor: "Marta Rojas Díaz", sustentoId: randomUUID() }),
    ).rejects.toMatchObject({ campos: { sustento: MENSAJE } });
    expect(await prisma.solicitudArco.count()).toBe(0);
  });

  it("@HU-GAR-13 CA1 los endpoints reciben el documento: 201 con uno propio y 400 con uno ajeno", async () => {
    const sustento = await sustentoDe(marta);
    const correccion = await solicitarHttp(
      pedir("/api/arco/solicitudes", "POST", tokenMarta, {
        tipo: "RECTIFICACION",
        campo: "NOMBRE",
        valor: "Marta Rojas Díaz",
        sustentoId: sustento,
      }),
      undefined,
    );
    expect(correccion.status).toBe(201);
    const ajeno = await solicitarHttp(
      pedir("/api/arco/solicitudes", "POST", tokenMarta, {
        tipo: "RECTIFICACION",
        campo: "DNI",
        valor: "12345678",
        sustentoId: await sustentoDe(ana),
      }),
      undefined,
    );
    expect(ajeno.status).toBe(400);
    expect((await ajeno.json()).campos).toEqual({ sustento: MENSAJE });
    const numero = await contactoHttp(
      pedir("/api/perfil/contacto", "POST", tokenMarta, {
        telefono: "987654329",
        sustentoId: await sustentoDe(marta),
      }),
      undefined,
    );
    expect(numero.status).toBe(201);
  });

  it("@HU-GAR-13 CA1 AC-7 el documento lo ve quien lo subió y la administración; otra persona, nunca", async () => {
    const sustento = await sustentoDe(marta);
    const ver = (token: string) =>
      descargarHttp(pedir(`/api/archivos/${sustento}`, "GET", token), {
        params: Promise.resolve({ id: sustento }),
      });
    expect((await ver(tokenMarta)).status).toBe(302);
    expect((await ver(tokenAna)).status).toBe(302);
    expect((await ver(tokenPedro)).status).toBe(404);
  });

  it("@HU-GAR-13 CA1 el vecino pide la subida firmada del documento; la directiva no lo necesita para otros usos", async () => {
    const r = await pedirSubidaHttp(
      pedir("/api/archivos", "POST", tokenMarta, {
        uso: "sustento_arco",
        tipo: "image/jpeg",
        tamano: 2_000_000,
      }),
      undefined,
    );
    expect(r.status).toBe(201);
    expect(
      await prisma.archivo.findFirstOrThrow({ where: { subidoPor: marta.usuarioId, uso: "sustento_arco" } }),
    ).toMatchObject({
      tipo: "image/jpeg",
    });
    const demasiado = await pedirSubidaHttp(
      pedir("/api/archivos", "POST", tokenMarta, {
        uso: "sustento_arco",
        tipo: "image/jpeg",
        tamano: 9_000_000,
      }),
      undefined,
    );
    expect(demasiado.status).toBe(400);
  });
});
