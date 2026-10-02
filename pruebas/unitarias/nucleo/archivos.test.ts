import { firmarUrl } from "@/compartido/archivos/firma";
import { firmarDescarga, prepararSubida, VIGENCIA_SEGUNDOS, validarArchivo } from "@/compartido/archivos/r2";
import { ErrorValidacion } from "@/compartido/errores";
import { abrirBucketSimulado, type BucketSimulado } from "@/pruebas/soporte/bucketSimulado";

const ENTORNO = {
  R2_ID_CUENTA: "cuenta-de-prueba",
  R2_BUCKET: "juntas-vecinales-archivos",
  R2_ID_CLAVE_ACCESO: "clave-de-prueba",
  R2_CLAVE_ACCESO_SECRETA: "secreto-de-prueba",
};
const HOST = "cuenta-de-prueba.r2.cloudflarestorage.com";
const MB = 1024 * 1024;
const T0 = new Date("2026-10-05T15:00:00Z");
const segundos = (s: number) => new Date(T0.getTime() + s * 1000);

let bucket: BucketSimulado;
beforeAll(async () => {
  bucket = await abrirBucketSimulado(HOST, ENTORNO.R2_BUCKET, ENTORNO.R2_CLAVE_ACCESO_SECRETA);
});
afterAll(() => bucket.cerrar());

/** La URL firmada apunta a R2; en la prueba se envía al bucket simulado con la misma ruta y consulta. */
const alBucket = (url: string) => {
  const u = new URL(url);
  expect(u.host).toBe(HOST);
  return `${bucket.origen}${u.pathname}${u.search}`;
};

const errorDeCampo = (accion: () => unknown) => {
  try {
    accion();
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorValidacion);
    return (error as ErrorValidacion).campos.archivo;
  }
  throw new Error("se esperaba un error de validación");
};

describe("@HU-INFRA Firma SigV4", () => {
  it("@HU-INFRA coincide con el ejemplo publicado por AWS para URLs firmadas", () => {
    const url = firmarUrl(
      {
        metodo: "GET",
        host: "examplebucket.s3.amazonaws.com",
        ruta: "/test.txt",
        region: "us-east-1",
        vigenciaSegundos: 86400,
        ahora: new Date("2013-05-24T00:00:00Z"),
      },
      { idClave: "AKIAIOSFODNN7EXAMPLE", secreto: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" },
    );
    expect(new URL(url).searchParams.get("X-Amz-Signature")).toBe(
      "aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404",
    );
  });
});

describe("@HU-INFRA Archivos en R2 con URLs firmadas", () => {
  it("@HU-INFRA valida en el servidor el tipo y el tamaño, con mensajes que dicen qué hacer", () => {
    expect(validarArchivo({ tipo: "image/jpeg", tamano: MB }, "documento").extension).toBe("jpg");
    expect(validarArchivo({ tipo: "video/mp4", tamano: 19 * MB }, "evidencia").extension).toBe("mp4");

    expect(errorDeCampo(() => validarArchivo({ tipo: "video/mp4", tamano: MB }, "documento"))).toBe(
      "Este archivo no se puede subir. Elija una foto (JPG o PNG) o un PDF.",
    );
    expect(
      errorDeCampo(() => validarArchivo({ tipo: "application/zip", tamano: MB }, "evidencia")),
    ).toContain("un video MP4");
    expect(errorDeCampo(() => validarArchivo({ tipo: "image/png", tamano: 6 * MB }, "documento"))).toBe(
      "El archivo pesa más de 5 MB. Elija uno más liviano o tome la foto de nuevo.",
    );
    expect(errorDeCampo(() => validarArchivo({ tipo: "video/mp4", tamano: 21 * MB }, "evidencia"))).toContain(
      "20 MB",
    );
    expect(errorDeCampo(() => validarArchivo({ tipo: "image/png", tamano: 0 }, "documento"))).toBe(
      "El archivo está vacío. Elija otro.",
    );
  });

  it("@HU-INFRA sube y descarga con URLs firmadas de 5 minutos", async () => {
    const contenido = Buffer.from("%PDF-1.7 comprobante de prueba");
    const subida = prepararSubida(
      { tipo: "application/pdf", tamano: contenido.length },
      "documento",
      "comprobantes",
      T0,
      ENTORNO,
    );
    expect(subida.clave).toMatch(/^comprobantes\/[0-9a-f-]{36}\.pdf$/);
    expect(new URL(subida.url).searchParams.get("X-Amz-Expires")).toBe(String(VIGENCIA_SEGUNDOS));
    expect(VIGENCIA_SEGUNDOS).toBe(300);
    expect(subida.venceEn).toEqual(segundos(300));

    bucket.ahora = segundos(60);
    const put = await fetch(alBucket(subida.url), {
      method: "PUT",
      headers: subida.cabeceras,
      body: contenido,
    });
    expect(put.status).toBe(200);

    const descarga = firmarDescarga(subida.clave, segundos(60), ENTORNO);
    const get = await fetch(alBucket(descarga.url));
    expect(get.status).toBe(200);
    expect(Buffer.from(await get.arrayBuffer())).toEqual(contenido);
  });

  it("@HU-INFRA una URL firmada caduca a los 5 minutos", async () => {
    const subida = prepararSubida({ tipo: "image/png", tamano: 4 }, "documento", "comprobantes", T0, ENTORNO);
    await fetch(alBucket(subida.url), { method: "PUT", headers: subida.cabeceras, body: "1234" });
    const { url } = firmarDescarga(subida.clave, T0, ENTORNO);

    bucket.ahora = segundos(300);
    expect((await fetch(alBucket(url))).status).toBe(200);
    bucket.ahora = segundos(301);
    const caducada = await fetch(alBucket(url));
    expect(caducada.status).toBe(403);
    expect(await caducada.text()).toBe("Request has expired");
  });

  it("@HU-INFRA no se puede subir un archivo distinto del validado ni alterar la URL", async () => {
    bucket.ahora = T0;
    const subida = prepararSubida(
      { tipo: "image/jpeg", tamano: 4 },
      "documento",
      "comprobantes",
      T0,
      ENTORNO,
    );
    const otroTipo = await fetch(alBucket(subida.url), {
      method: "PUT",
      headers: { ...subida.cabeceras, "content-type": "video/mp4" },
      body: "1234",
    });
    expect(otroTipo.status).toBe(403);
    const masGrande = await fetch(alBucket(subida.url), {
      method: "PUT",
      headers: { "content-type": "image/jpeg" },
      body: "12345678",
    });
    expect(masGrande.status).toBe(403);
    const otraClave = await fetch(alBucket(subida.url).replace("comprobantes/", "comprobantes/x"), {
      method: "PUT",
      headers: subida.cabeceras,
      body: "1234",
    });
    expect(otraClave.status).toBe(403);
  });

  it("@HU-INFRA no se puede listar el bucket: ni sin firma ni reutilizando la firma de un objeto", async () => {
    bucket.ahora = T0;
    const { url } = firmarDescarga("comprobantes/uno.pdf", T0, ENTORNO);
    const u = new URL(alBucket(url));
    expect((await fetch(`${bucket.origen}/${ENTORNO.R2_BUCKET}`)).status).toBe(403);
    expect((await fetch(`${bucket.origen}/${ENTORNO.R2_BUCKET}/?list-type=2`)).status).toBe(403);
    expect((await fetch(`${bucket.origen}/${ENTORNO.R2_BUCKET}/${u.search}`)).status).toBe(403);
    expect(() => firmarDescarga("", T0, ENTORNO)).toThrow("Hace falta la clave");
    expect(() => firmarDescarga("comprobantes/", T0, ENTORNO)).toThrow("Hace falta la clave");
  });

  it("@HU-INFRA sin las variables de R2 no firma nada", () => {
    expect(() => firmarDescarga("comprobantes/uno.pdf", T0, {})).toThrow("Faltan variables de R2");
  });
});
