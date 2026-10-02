import { GET as listarHttp } from "@/app/api/notificaciones/route";
import { PATCH as leidoHttp } from "@/app/api/notificaciones/[id]/route";
import { POST as todosHttp } from "@/app/api/notificaciones/leidas/route";
import { PUT as preferenciasHttp } from "@/app/api/perfil/notificaciones/route";
import { prisma } from "@/compartido/bd/cliente";
import { sembrar } from "@/compartido/bd/semillas";
import { ErrorNoEncontrado } from "@/compartido/errores";
import { despacharAvisos } from "@/compartido/notificaciones/despachar";
import { type AvisoNuevo, encolarAviso } from "@/compartido/notificaciones/encolar";
import { saleAlWhatsApp, PREFERENCIAS_POR_DEFECTO } from "@/compartido/notificaciones/preferencias";
import { crearSimulador } from "@/compartido/notificaciones/whatsapp";
import {
  avisosSinLeer,
  cambiarPreferencias,
  marcarAvisoLeido,
  misPreferencias,
  verAvisos,
} from "@/modulos/identidad/aplicacion/avisos";
import type { SesionDto } from "@/modulos/identidad/aplicacion/sesion";
import { iniciarSesionConClave } from "@/modulos/identidad/aplicacion/iniciarSesionConClave";

const T0 = new Date("2026-10-05T15:00:00Z");
const minutos = (m: number) => new Date(T0.getTime() + m * 60_000);
let marta: SesionDto;
let tokenMarta: string;
let ana: SesionDto;

async function enviar(
  aviso: Omit<AvisoNuevo, "destinatarioId">,
  cuando: Date,
  destinatarioId = marta.usuarioId,
) {
  const { id } = await prisma.$transaction((tx) => encolarAviso({ destinatarioId, ...aviso }, tx));
  await prisma.avisoEnCola.update({ where: { id }, data: { creadoEn: cuando, reintentarDesde: cuando } });
  await despacharAvisos(cuando, crearSimulador({}));
  await prisma.notificacion.update({ where: { avisoId: id }, data: { creadaEn: cuando } });
}
const conWhatsApp = (plantilla: string) => ({ telefono: "51900000002", plantilla, parametros: ["Marta"] });
const pedir = (url: string, metodo = "GET", cuerpo?: unknown) =>
  new Request(`http://localhost${url}`, {
    method: metodo,
    headers: { cookie: `sesion=${tokenMarta}` },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE identidad_usuarios, identidad_predios, nucleo_cola_avisos, nucleo_preferencias_aviso CASCADE`;
  await sembrar("clave-de-prueba");
  ({ sesion: marta, token: tokenMarta } = await iniciarSesionConClave({
    dni: "40000002",
    clave: "clave-de-prueba",
  }));
  ({ sesion: ana } = await iniciarSesionConClave({ dni: "40000001", clave: "clave-de-prueba" }));
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("@HU-GAR-20 Centro de notificaciones unificado", () => {
  it("@HU-GAR-20 CA1 lista los avisos de la persona, los más nuevos arriba, con su origen", async () => {
    await enviar({ tipo: "PAGOS", titulo: "Recibo listo", texto: "Su recibo ya está." }, T0);
    await enviar({ tipo: "ASAMBLEAS", titulo: "Asamblea el sábado", texto: "A las 4 p. m." }, minutos(5));
    await enviar(
      { tipo: "PAGOS", titulo: "De otra persona", texto: "No es suyo." },
      minutos(6),
      ana.usuarioId,
    );
    const { avisos, noLeidos } = await verAvisos(marta);
    expect(noLeidos).toBe(2);
    expect(avisos.map((a) => [a.titulo, a.origen, a.nuevo])).toEqual([
      ["Asamblea el sábado", "Asambleas", true],
      ["Recibo listo", "Pagos", true],
    ]);
  });

  it("@HU-GAR-20 CA2 filtra por tipo y marca como leídos, uno o todos; de otra persona responde 404", async () => {
    await enviar({ tipo: "PAGOS", titulo: "Recibo listo", texto: "Su recibo ya está." }, T0);
    await enviar({ tipo: "GARITA", titulo: "Visita en la puerta", texto: "Llegó Pedro." }, minutos(1));
    await enviar(
      { tipo: "SEGURIDAD", titulo: "La reja no se abre sola", texto: "Tiene ocho semanas pendientes." },
      minutos(2),
    );
    const garita = await (await listarHttp(pedir("/api/notificaciones?tipo=garita"), undefined)).json();
    expect(garita.avisos.map((a: { titulo: string }) => a.titulo)).toEqual([
      "La reja no se abre sola",
      "Visita en la puerta",
    ]);
    expect(
      (await (await listarHttp(pedir("/api/notificaciones?tipo=otro"), undefined)).json()).avisos,
    ).toHaveLength(3);

    const [primero] = (await verAvisos(marta, "pagos")).avisos;
    expect(
      (
        await leidoHttp(pedir(`/api/notificaciones/${primero.id}`, "PATCH"), {
          params: Promise.resolve({ id: primero.id }),
        })
      ).status,
    ).toBe(204);
    expect(await avisosSinLeer(marta)).toBe(2);
    await expect(marcarAvisoLeido(ana, primero.id)).rejects.toBeInstanceOf(ErrorNoEncontrado);

    expect((await todosHttp(pedir("/api/notificaciones/leidas", "POST"), undefined)).status).toBe(204);
    // CA3: el contador se lee en cada carga, ya en cero.
    expect(await avisosSinLeer(marta)).toBe(0);
  });
});

describe("@HU-GAR-18 Preferencias de notificación", () => {
  it("@HU-GAR-18 CA1 cada tipo se activa o desactiva por separado; sin cambios, los valores por defecto", async () => {
    expect(await misPreferencias(marta)).toEqual(PREFERENCIAS_POR_DEFECTO);
    const respuesta = await preferenciasHttp(
      pedir("/api/perfil/notificaciones", "PUT", { pagos: false }),
      undefined,
    );
    expect(await respuesta.json()).toEqual({ ...PREFERENCIAS_POR_DEFECTO, pagos: false });
    const desconocido = await preferenciasHttp(
      pedir("/api/perfil/notificaciones", "PUT", { cuenta: false }),
      undefined,
    );
    expect(desconocido.status).toBe(400);
  });

  it("@HU-GAR-18 CA2 CA3 se aplican al próximo envío; los avisos de cuenta y seguridad salen siempre, y la copia interna existe", async () => {
    await cambiarPreferencias(marta, { pagos: false });
    await enviar(
      {
        tipo: "PAGOS",
        titulo: "Recordatorio",
        texto: "Tiene una semana pendiente.",
        whatsapp: conWhatsApp("recordatorio"),
      },
      T0,
    );
    await cambiarPreferencias(marta, { whatsapp: false });
    await enviar(
      {
        tipo: "SEGURIDAD",
        titulo: "La reja no se abre sola",
        texto: "Ocho semanas.",
        whatsapp: conWhatsApp("garita"),
      },
      minutos(1),
    );
    await enviar(
      { tipo: "ASAMBLEAS", titulo: "Asamblea", texto: "Sábado.", whatsapp: conWhatsApp("asamblea") },
      minutos(2),
    );

    const estados = await prisma.avisoEnCola.findMany({
      orderBy: { creadoEn: "asc" },
      select: { tipo: true, estado: true },
    });
    expect(estados).toEqual([
      { tipo: "PAGOS", estado: "SIN_CANAL_EXTERNO" },
      { tipo: "SEGURIDAD", estado: "ENVIADA" },
      { tipo: "ASAMBLEAS", estado: "SIN_CANAL_EXTERNO" },
    ]);
    expect((await verAvisos(marta)).avisos).toHaveLength(3);
  });

  it("@HU-GAR-18 CA3 regla: cuenta y seguridad siempre; el resto según su tipo y el WhatsApp", () => {
    const nada = {
      whatsapp: false,
      pagos: false,
      asambleas: false,
      reportes: false,
      garita: false,
      noticias: false,
    };
    expect(saleAlWhatsApp(nada, "CUENTA")).toBe(true);
    expect(saleAlWhatsApp(nada, "SEGURIDAD")).toBe(true);
    expect(saleAlWhatsApp({ ...nada, noticias: true }, "NOTICIAS")).toBe(false);
    expect(saleAlWhatsApp({ ...nada, whatsapp: true, noticias: true }, "NOTICIAS")).toBe(true);
  });
});
