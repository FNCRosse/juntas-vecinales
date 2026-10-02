import type { Metadata } from "next";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { consultarEnlace } from "@/modulos/identidad/aplicacion/entrarConEnlace";
import { BotonEntrar } from "./_componentes/BotonEntrar";

// El token va en la ruta: que no salga en la cabecera Referer hacia otros sitios.
export const metadata: Metadata = { title: "Entrar con su enlace", referrer: "no-referrer" };

// VEC-ACC-01 Entrar con el enlace (HU-GAR-02 CA1). Abrir la página no gasta el enlace.
export default async function EntrarConEnlace({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const bienvenida = await consultarEnlace(token);

  if (bienvenida.estado !== "VIGENTE") {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-titulo-1">Este enlace ya no sirve</h1>
        <MensajeEstado tipo="aviso" titulo="Su cuenta está bien">
          <p>Cada enlace sirve una sola vez y por 15 minutos. Si pidió otro, solo sirve el último.</p>
          <p>Pida un enlace nuevo a la administración de la junta.</p>
        </MensajeEstado>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-titulo-1">Le damos la bienvenida, {bienvenida.nombre}</h1>
        {bienvenida.direccion && (
          <p>
            Va a entrar a su cuenta de <strong>{bienvenida.direccion}</strong>.
          </p>
        )}
        <p>
          Llegó aquí con el enlace que le mandamos por WhatsApp. Le deja entrar sin clave. Al pulsar el botón,
          entrará directo a su cuenta.
        </p>
      </div>
      <BotonEntrar token={token} />
    </div>
  );
}
