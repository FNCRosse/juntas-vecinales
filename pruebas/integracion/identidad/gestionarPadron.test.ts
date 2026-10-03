import { PATCH as actualizarHttp } from "@/app/api/admin/padron/[predioId]/route";
import { POST as desvincularHttp } from "@/app/api/admin/padron/[predioId]/desvincular/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorNoEncontrado, ErrorReglaNegocio } from "@/compartido/errores";
import { verVivienda } from "@/modulos/identidad/aplicacion/consultarPadron";
import { actualizarPredio, darDeBajaResidente } from "@/modulos/identidad/aplicacion/gestionarPadron";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import { obtenerSesion, type SesionDto } from "@/modulos/identidad/aplicacion/sesion";

const CLAVE = "clave-de-prueba";
let ana: SesionDto;
let tokenAna: string;

const predioDe = (manzana: string, lote: string) =>
  prisma.predio.findUniqueOrThrow({ where: { manzana_lote: { manzana, lote } } });
const idDe = async (dni: string) => (await prisma.usuario.findUniqueOrThrow({ where: { dni } })).id;
const pedir = (metodo: string, cuerpo: unknown) =>
  new Request("http://localhost/api", {
    method: metodo,
    headers: { cookie: `sesion=${tokenAna}` },
    body: JSON.stringify(cuerpo),
  });
const conPredio = (predioId: string) => ({ params: Promise.resolve({ predioId }) });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos CASCADE`;
  await sembrar(CLAVE);
  ({ sesion: ana, token: tokenAna } = await iniciarSesionConClave({ dni: "40000001", clave: CLAVE }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-10 Actualizar los datos del predio", () => {
  it("@HU-GAR-10 CA1 CA3 cambia el uso y la ocupación y queda en el historial con el campo, antes, después y responsable", async () => {
    const c7 = await predioDe("C", "7");
    const respuesta = await actualizarHttp(
      pedir("PATCH", {
        uso: "VIVIENDA_Y_NEGOCIO",
        familias: 1,
        inquilinos: 0,
        autos: 1,
        motos: 0,
        triciclos: 0,
        negocios: 1,
        placas: { autos: ["zxc123"], motos: [] },
      }),
      conPredio(c7.id),
    );
    expect(respuesta.status).toBe(200);
    expect(await predioDe("C", "7")).toMatchObject({
      uso: "VIVIENDA_Y_NEGOCIO",
      inquilinos: 0,
      autos: 1,
      negocios: 1,
    });

    const registro = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "actualizar_predio", entidadId: c7.id },
    });
    expect(registro).toMatchObject({
      actorId: ana.usuarioId,
      antes: { uso: "VIVIENDA", inquilinos: 1, autos: 0, negocios: 0, placasAutos: "ninguna" },
      despues: { uso: "VIVIENDA_Y_NEGOCIO", inquilinos: 0, autos: 1, negocios: 1, placasAutos: "ZXC-123" },
    });
    const ficha = await verVivienda(ana, c7.id);
    expect(ficha.historial[0]).toMatchObject({
      actor: "Ana Flores",
      texto:
        "Actualizó los datos: uso vivienda → vivienda y negocio; inquilinos 1 → 0; autos o camionetas 0 → 1; locales de negocio 0 → 1; placas de autos ninguna → ZXC-123",
    });
  });

  it("@HU-GAR-10 CA1 sin cambios, con valores fuera del contador o sin permiso, no guarda", async () => {
    const c7 = await predioDe("C", "7");
    const igual = {
      uso: "VIVIENDA" as const,
      familias: 1,
      inquilinos: 1,
      autos: 0,
      motos: 0,
      triciclos: 0,
      negocios: 0,
    };
    await expect(actualizarPredio(ana, c7.id, igual)).rejects.toBeInstanceOf(ErrorReglaNegocio);
    const fuera = await actualizarHttp(pedir("PATCH", { ...igual, autos: 12 }), conPredio(c7.id));
    expect(fuera.status).toBe(400);
    expect((await fuera.json()).campos).toEqual({ "vivienda.autos": "Elija un número entre 0 y 9." });
    await expect(actualizarPredio(ana, "no-existe", igual)).rejects.toBeInstanceOf(ErrorNoEncontrado);
    const { sesion: marta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE });
    await expect(
      actualizarPredio(marta, c7.id, { ...igual, autos: 1, placas: { autos: ["ZXC123"], motos: [] } }),
    ).rejects.toBeInstanceOf(ErrorNoAutorizado);
  });
});

describe("@HU-GAR-10 Placas al actualizar el predio", () => {
  const igual = {
    uso: "VIVIENDA" as const,
    familias: 1,
    inquilinos: 1,
    autos: 0,
    motos: 0,
    triciclos: 0,
    negocios: 0,
  };

  it("@HU-GAR-10 CA1 CA3 agregar un vehículo pide su placa, la guarda y queda en el historial; quitarlo la borra", async () => {
    const c7 = await predioDe("C", "7");
    await expect(actualizarPredio(ana, c7.id, { ...igual, motos: 1 })).rejects.toMatchObject({
      campos: { "placas.motos.0": "Escriba la placa de la moto 1." },
    });
    await actualizarPredio(ana, c7.id, { ...igual, motos: 1, placas: { autos: [], motos: ["1234a"] } });
    expect((await verVivienda(ana, c7.id)).vehiculos).toEqual([{ placa: "1234A", tipo: "moto" }]);
    expect((await verVivienda(ana, c7.id)).historial[0].texto).toContain("placas de motos ninguna → 1234A");

    await actualizarPredio(ana, c7.id, { ...igual, motos: 0 });
    expect((await verVivienda(ana, c7.id)).vehiculos).toEqual([]);
  });

  it("@HU-GAR-10 CA1 cambiar solo una placa cuenta como cambio y la placa de otra vivienda no se acepta", async () => {
    const a3 = await predioDe("A", "3");
    const actual = {
      uso: "VIVIENDA" as const,
      familias: 1,
      inquilinos: 0,
      autos: 1,
      motos: 0,
      triciclos: 0,
      negocios: 0,
    };
    // La placa que ya tenía esta vivienda no cuenta como repetida: sin cambios no guarda.
    await expect(
      actualizarPredio(ana, a3.id, { ...actual, placas: { autos: ["jlm314"], motos: [] } }),
    ).rejects.toBeInstanceOf(ErrorReglaNegocio);
    await actualizarPredio(ana, a3.id, { ...actual, placas: { autos: ["QWE456"], motos: [] } });
    expect((await verVivienda(ana, a3.id)).vehiculos).toEqual([{ placa: "QWE-456", tipo: "auto" }]);
    const c7 = await predioDe("C", "7");
    await expect(
      actualizarPredio(ana, c7.id, { ...igual, autos: 1, placas: { autos: ["qwe 456"], motos: [] } }),
    ).rejects.toMatchObject({
      campos: { "placas.autos.0": expect.stringContaining("ya está registrada en Mz. A, lote 3") },
    });
  });
});

describe("@HU-GAR-09 Desvincular a un ex residente", () => {
  it("@HU-GAR-09 CA1 CA2 CA3 cierra su residencia, pasa a inactivo, cierra sus sesiones y le avisa", async () => {
    const b11 = await predioDe("B", "11");
    const victor = await idDe("40000009");
    const sesionVictor = (
      await prisma.sesion.create({ data: { usuarioId: victor, tokenHash: "hash-de-prueba" } })
    ).id;

    const respuesta = await desvincularHttp(
      pedir("POST", { usuarioId: victor, motivo: "MUDANZA" }),
      conPredio(b11.id),
    );
    expect(await respuesta.json()).toEqual({ nombre: "Víctor Salas", direccion: "Mz. B, lote 11" });

    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { id: victor },
      include: { residencias: true },
    });
    expect(usuario.estado).toBe("DESVINCULADA");
    expect(usuario.residencias[0].fechaFin).not.toBeNull();
    expect(
      (await prisma.sesion.findUniqueOrThrow({ where: { id: sesionVictor } })).revocadaEn,
    ).not.toBeNull();
    expect(await prisma.avisoEnCola.findFirstOrThrow({ where: { plantilla: "baja_padron" } })).toMatchObject({
      telefono: "51900000009",
      parametros: ["Víctor", "Mz. B, lote 11"],
    });
    // La vivienda queda sin residentes en el padrón; su historial dice qué pasó y quién lo hizo.
    const ficha = await verVivienda(ana, b11.id);
    expect(ficha.residentes).toEqual([]);
    expect(ficha.historial[0]).toMatchObject({
      actor: "Ana Flores",
      texto: "Dio de baja a Víctor Salas: se mudó del barrio",
    });
  });

  it("@HU-GAR-09 CA2 una vecina de la directiva deja de ser vecina pero conserva su rol de equipo", async () => {
    const { token: tokenMarta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE });
    const a12 = await predioDe("A", "12");
    await darDeBajaResidente(ana, a12.id, await idDe("40000002"), "MUDANZA");
    const marta = await prisma.usuario.findUniqueOrThrow({ where: { dni: "40000002" } });
    expect([marta.estado, marta.roles]).toEqual(["ACTIVA", ["DIRECTIVA"]]);
    expect(await obtenerSesion(tokenMarta)).toBeNull();
  });

  it("@HU-GAR-09 solo a quien vive en ese predio, con un motivo válido", async () => {
    const b11 = await predioDe("B", "11");
    await expect(darDeBajaResidente(ana, b11.id, await idDe("40000006"), "OTRO")).rejects.toBeInstanceOf(
      ErrorNoEncontrado,
    );
    const sinMotivo = await desvincularHttp(pedir("POST", { usuarioId: "x" }), conPredio(b11.id));
    expect((await sinMotivo.json()).campos).toEqual({ motivo: "Elija por qué se le da de baja." });
  });
});
