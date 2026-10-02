import { crearCanalMeta, crearSimulador, elegirCanal } from "@/compartido/notificaciones/whatsapp";

const mensaje = { telefono: "51900000001", plantilla: "recibo_listo", parametros: ["000318"] };
const credenciales = { WHATSAPP_ID_NUMERO: "123", WHATSAPP_TOKEN: "token-de-prueba" };

describe("@HU-INFRA ADR-006 Adaptador de WhatsApp", () => {
  it("@HU-INFRA fuera de producción el valor por defecto es el simulador; en producción, Meta", () => {
    expect(elegirCanal({}).nombre).toBe("simulador");
    expect(elegirCanal({ NODE_ENV: "development" }).nombre).toBe("simulador");
    expect(elegirCanal({ NODE_ENV: "production" }).nombre).toBe("meta");
    expect(elegirCanal({ NODE_ENV: "production", WHATSAPP_MODO: "simulador" }).nombre).toBe("simulador");
    expect(elegirCanal({ WHATSAPP_MODO: "meta" }).nombre).toBe("meta");
    expect(() => elegirCanal({ WHATSAPP_MODO: "otro" })).toThrow("WHATSAPP_MODO desconocido");
  });

  it("@HU-INFRA el simulador no sale a la red y falla solo si se le pide", async () => {
    await expect(crearSimulador({}).enviar(mensaje)).resolves.toBeUndefined();
    await expect(crearSimulador({ WHATSAPP_SIMULAR_FALLO: "1" }).enviar(mensaje)).rejects.toThrow(
      "Fallo simulado",
    );
  });

  it("@HU-INFRA Meta recibe la plantilla con sus parámetros en el número de prueba", async () => {
    const enviarHttp = jest.fn(async () => new Response("{}", { status: 200 }));
    await crearCanalMeta(credenciales, enviarHttp as unknown as typeof fetch).enviar(mensaje);

    const [url, opciones] = enviarHttp.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v21.0/123/messages");
    expect(opciones.headers).toMatchObject({ authorization: "Bearer token-de-prueba" });
    expect(JSON.parse(String(opciones.body))).toEqual({
      messaging_product: "whatsapp",
      to: "51900000001",
      type: "template",
      template: {
        name: "recibo_listo",
        language: { code: "es" },
        components: [{ type: "body", parameters: [{ type: "text", text: "000318" }] }],
      },
    });
  });

  it("@HU-INFRA una plantilla sin parámetros va sin componentes", async () => {
    const enviarHttp = jest.fn(async () => new Response("{}", { status: 200 }));
    await crearCanalMeta(credenciales, enviarHttp as unknown as typeof fetch).enviar({
      ...mensaje,
      parametros: [],
    });
    const [, opciones] = enviarHttp.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(opciones.body)).template.components).toEqual([]);
  });

  it("@HU-INFRA si Meta rechaza el mensaje o faltan credenciales, el envío falla", async () => {
    const rechazo = jest.fn(async () => new Response("plantilla no aprobada", { status: 400 }));
    await expect(
      crearCanalMeta(credenciales, rechazo as unknown as typeof fetch).enviar(mensaje),
    ).rejects.toThrow("Meta respondió 400: plantilla no aprobada");
    await expect(crearCanalMeta({}).enviar(mensaje)).rejects.toThrow("Faltan WHATSAPP_ID_NUMERO");
  });
});
