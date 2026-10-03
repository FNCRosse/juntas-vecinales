import { randomUUID } from "node:crypto";
import { POST as registrarHttp } from "@/app/api/quejas/asistida/route";
import { GET as buscarHttp } from "@/app/api/quejas/asistida/vecinos/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoAutorizado, ErrorNoEncontrado } from "@/compartido/errores";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import {
  bandejaDeQuejas,
  lugaresParaAsistir,
  misQuejas,
  registrarQuejaAsistida,
  vecinosParaAsistir,
} from "@/modulos/incidencias/aplicacion/quejas";

const T0 = new Date("2026-09-27T15:58:00Z");
const CLAVE = "clave-de-prueba";
let pedro: SesionDto;
let tokenPedro: string;
let marta: SesionDto;
let carmenId: string;

const datos = (cambios: Partial<Parameters<typeof registrarQuejaAsistida>[1]> = {}) => ({
  vecinoId: carmenId,
  categoria: "BASURA",
  descripcion: "Dejan bolsas de basura en la esquina desde hace una semana.",
  manzana: "D",
  referencia: "la esquina",
  evidencias: [],
  consentimiento: true,
  idOperacion: randomUUID(),
  ...cambios,
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_notificaciones, nucleo_archivos, incidencias_quejas CASCADE`;
  await sembrar(CLAVE);
  ({ sesion: pedro, token: tokenPedro } = await iniciarSesionConClave({ dni: "40000003", clave: CLAVE }));
  ({ sesion: marta } = await iniciarSesionConClave({ dni: "40000002", clave: CLAVE }));
  carmenId = (await prisma.usuario.findUniqueOrThrow({ where: { dni: "08123478" } })).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const comoCarmen = async (): Promise<SesionDto> => ({
  usuarioId: carmenId,
  nombreCompleto: "Carmen Huamán",
  roles: ["VECINO_ADULTO_MAYOR"],
  politicaAceptada: true,
});

describe("@HU-QUE-03 Queja asistida por el mediador", () => {
  it("@HU-QUE-03 CA1 el mediador busca al vecino por nombre, DNI o casa, sin ver su DNI ni teléfono", async () => {
    const buscar = async (q: string) =>
      (
        await (
          await buscarHttp(
            new Request(`http://localhost/api/quejas/asistida/vecinos?q=${encodeURIComponent(q)}`, {
              headers: { cookie: `sesion=${tokenPedro}` },
            }),
            undefined,
          )
        ).json()
      ).map((v: { nombre: string; casa: string }) => `${v.nombre} · ${v.casa}`);
    expect(await buscar("carmen")).toEqual(["Carmen Huamán · Mz. C, lote 7"]);
    expect(await buscar("08123478")).toEqual(["Carmen Huamán · Mz. C, lote 7"]);
    expect(await buscar("Mz. B")).toEqual(["Rosa Díaz · Mz. B, lote 2", "Víctor Salas · Mz. B, lote 11"]);
    expect(await buscar("b 11")).toEqual(["Víctor Salas · Mz. B, lote 11"]);
    expect(await buscar("x")).toEqual([]);
    const [primero] = await vecinosParaAsistir(pedro, "carmen");
    expect(Object.keys(primero).sort()).toEqual(["casa", "id", "nombre"]);
    expect(await lugaresParaAsistir(pedro)).toEqual(["A", "B", "C", "D"]);
  });

  it("@HU-QUE-01 @HU-QUE-03 CA1 CA3 registra con sus palabras, sin foto; queda a nombre del vecino y del mediador, con constancia", async () => {
    const respuesta = await registrarHttp(
      new Request("http://localhost/api/quejas/asistida", {
        method: "POST",
        headers: { cookie: `sesion=${tokenPedro}` },
        body: JSON.stringify(datos()),
      }),
      undefined,
    );
    expect(respuesta.status).toBe(201);
    const constancia = await respuesta.json();
    expect(constancia).toMatchObject({
      vecino: "Carmen Huamán",
      registradaPor: "Pedro Chávez",
      categoria: "Basura",
      estadoTexto: "Recibido, pendiente de revisión",
      esAnonimo: false,
    });
    expect(constancia.codigo).toMatch(/^Q-\d{4}-\d{5}-[A-Z2-9]{4}$/);
    expect(await prisma.queja.findUniqueOrThrow({ where: { id: constancia.id } })).toMatchObject({
      denuncianteId: carmenId,
      registradaPor: pedro.usuarioId,
    });
    expect((await misQuejas(await comoCarmen())).map((q) => q.codigo)).toEqual([constancia.codigo]);
    const registro = await prisma.registroAuditoria.findFirstOrThrow({
      where: { accion: "registrar_queja_asistida", entidadId: constancia.id },
    });
    expect(registro.actorId).toBe(pedro.usuarioId);
    expect(await prisma.avisoEnCola.count({ where: { tipo: "REPORTES" } })).toBe(2);
  });

  it("@HU-QUE-03 CA2 con anonimato a pedido del vecino, la directiva ve 'Reporte anónimo' y el vecino lo sigue viendo", async () => {
    const { queja } = await registrarQuejaAsistida(pedro, datos({ esAnonimo: true }), T0);
    expect(queja.esAnonimo).toBe(true);
    const fila = await prisma.queja.findUniqueOrThrow({ where: { id: queja.id } });
    expect(fila).toMatchObject({ denuncianteId: null, registradaPor: pedro.usuarioId });
    expect((await bandejaDeQuejas(marta)).quejas[0].quien).toBe("Reporte anónimo");
    expect((await misQuejas(await comoCarmen())).map((q) => q.codigo)).toEqual([queja.codigo]);
  });

  it("@HU-QUE-03 exige vecino, consentimiento y descripción; solo el mediador; AC-5", async () => {
    await expect(registrarQuejaAsistida(pedro, datos({ vecinoId: "no-existe" }), T0)).rejects.toBeInstanceOf(
      ErrorNoEncontrado,
    );
    await expect(
      registrarQuejaAsistida(pedro, datos({ consentimiento: false, descripcion: " " }), T0),
    ).rejects.toMatchObject({
      campos: {
        consentimiento: "Confirme que el vecino aceptó la política de privacidad.",
        descripcion: expect.stringContaining("Falta contar qué pasó"),
      },
    });
    await expect(registrarQuejaAsistida(marta, datos(), T0)).rejects.toBeInstanceOf(ErrorNoAutorizado);
    await expect(vecinosParaAsistir(marta, "carmen")).rejects.toBeInstanceOf(ErrorNoAutorizado);
    const pedido = datos();
    const primera = await registrarQuejaAsistida(pedro, pedido, T0);
    expect((await registrarQuejaAsistida(pedro, pedido, T0)).creada).toBe(false);
    expect(await prisma.queja.count()).toBe(1);
    expect(primera.creada).toBe(true);
  });
});
