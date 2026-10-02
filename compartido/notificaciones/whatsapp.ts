// Adaptador de WhatsApp (docs/BACKEND.md §7): Cloud API de Meta o simulador, según WHATSAPP_MODO.

export type MensajeWhatsApp = {
  telefono: string;
  /** Nombre de la plantilla aprobada en Meta (los textos viven en plantillas.ts, M1). */
  plantilla: string;
  parametros: string[];
};

export interface CanalWhatsApp {
  readonly nombre: "meta" | "simulador";
  enviar(mensaje: MensajeWhatsApp): Promise<void>;
}

type Entorno = Record<string, string | undefined>;

const VERSION_API = "v21.0";

/** Cloud API de Meta con el número de prueba. Lanza un error si Meta no acepta el mensaje. */
export function crearCanalMeta(entorno: Entorno, enviarHttp: typeof fetch = fetch): CanalWhatsApp {
  return {
    nombre: "meta",
    async enviar({ telefono, plantilla, parametros }) {
      const { WHATSAPP_ID_NUMERO: idNumero, WHATSAPP_TOKEN: token } = entorno;
      if (!idNumero || !token) throw new Error("Faltan WHATSAPP_ID_NUMERO o WHATSAPP_TOKEN");
      const respuesta = await enviarHttp(`https://graph.facebook.com/${VERSION_API}/${idNumero}/messages`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telefono,
          type: "template",
          template: {
            name: plantilla,
            language: { code: "es" },
            components: parametros.length
              ? [{ type: "body", parameters: parametros.map((text) => ({ type: "text", text })) }]
              : [],
          },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!respuesta.ok) throw new Error(`Meta respondió ${respuesta.status}: ${await respuesta.text()}`);
    },
  };
}

/**
 * No sale a la red: el aviso queda igual en el centro de notificaciones con canal "simulador".
 * Con WHATSAPP_SIMULAR_FALLO=1 falla siempre, para probar los reintentos y la copia interna.
 */
export function crearSimulador(entorno: Entorno): CanalWhatsApp {
  return {
    nombre: "simulador",
    async enviar() {
      if (entorno.WHATSAPP_SIMULAR_FALLO === "1") throw new Error("Fallo simulado de WhatsApp");
    },
  };
}

/** El simulador es el valor por defecto fuera de producción; en producción, Meta. */
export function elegirCanal(entorno: Entorno = process.env): CanalWhatsApp {
  const modo = entorno.WHATSAPP_MODO || (entorno.NODE_ENV === "production" ? "meta" : "simulador");
  if (modo === "meta") return crearCanalMeta(entorno);
  if (modo === "simulador") return crearSimulador(entorno);
  throw new Error(`WHATSAPP_MODO desconocido: ${modo}`);
}
