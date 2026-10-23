"use client";
// @HU-COB-12

import { ChevronLeft, Send, Wallet } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";

type Opcion = { valor: string; etiqueta: string; detalle: string };
type Pedido = {
  numero: string;
  enviado: string;
  recibo: string;
  donde: string;
  franja: string;
  estado: string;
};

// VEC-COB-14 y VEC-COB-15: pedir el recibo en papel. Recibo y hora van en hojas para no pasar de los objetivos permitidos
// (R-11). Pedirlo no mueve dinero ni se cobra: un solo botón, sin segunda confirmación. Si se reintenta por una falla de
// red, el mismo identificador evita pedirlo dos veces (AC-5).
export function PedirReciboEnPapel({
  quienPide,
  direccion,
  telefono,
  recibos,
  franjas,
  reciboInicial,
}: {
  quienPide: string;
  direccion: string;
  telefono: string;
  recibos: Opcion[];
  franjas: Opcion[];
  reciboInicial: string | null;
}) {
  const [reciboId, setReciboId] = useState<string | null>(
    reciboInicial ?? (recibos.length === 1 ? recibos[0].valor : null),
  );
  const [franja, setFranja] = useState<string | null>(null);
  const [nota, setNota] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const idOperacion = useRef<string>(null);

  async function enviar() {
    const nuevos: Record<string, string> = {};
    if (!reciboId) nuevos.reciboId = "Elija qué recibo necesita.";
    if (!franja) nuevos.franja = "Elija a qué hora le queda mejor que vayan.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<Pedido>("/api/aportes/recibos-en-papel", "POST", {
      reciboId,
      franja,
      nota,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) return setPedido(r.datos);
    if (r.estado === 400) setErrores(r.campos);
    else setFalla(r.error);
  }

  if (pedido) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Pedido enviado a la directiva">
          <p>La directiva la llamará para acordar el día en que le llevarán el recibo.</p>
        </MensajeEstado>
        <h1 className="text-titulo-1">Le llevarán su recibo</h1>
        <section
          aria-label="Su pedido"
          className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
        >
          <p className="text-pequeno text-texto-secundario">
            Pedido N.° {pedido.numero} · {pedido.enviado}
          </p>
          <dl className="flex flex-col gap-3">
            {[
              ["Recibo", pedido.recibo],
              ["Dónde", pedido.donde],
              ["Hora preferida", pedido.franja],
            ].map(([etiqueta, valor]) => (
              <div key={etiqueta} className="flex flex-col">
                <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
                <dd className="font-bold">{valor}</dd>
              </div>
            ))}
          </dl>
          <span className="inline-flex self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
            {pedido.estado}
          </span>
        </section>
        <p>Mientras tanto, su recibo digital vale igual que el de papel.</p>
        <BotonEnlace href="/cuota/pagos" icono={Wallet}>
          Volver a Mis pagos y recibos
        </BotonEnlace>
      </div>
    );
  }

  const listaErrores = Object.entries(errores)
    .filter(([, mensaje]) => mensaje)
    .map(([campo, mensaje]) => ({ campo: `campo-${campo}`, mensaje }));
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
      className="flex flex-col gap-6"
    >
      <Link
        href="/cuota/pagos"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Mis pagos
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Pedir mi recibo en papel</h1>
        <p>Una persona de la directiva le llevará el recibo firmado a su casa.</p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <div className="flex flex-col gap-1">
        <p>
          <strong>Quién pide:</strong> {quienPide}
        </p>
        <p>
          <strong>Dirección:</strong> {direccion}
        </p>
        <p>
          <strong>Teléfono:</strong> {telefono}
        </p>
      </div>
      <SelectorEnHoja
        id="campo-reciboId"
        pregunta="¿Qué recibo necesita?"
        vacio="Elegir el recibo"
        opciones={recibos}
        valor={reciboId}
        alElegir={(valor) => {
          setReciboId(valor);
          setErrores({ ...errores, reciboId: "" });
        }}
        error={errores.reciboId}
      />
      <SelectorEnHoja
        id="campo-franja"
        pregunta="¿A qué hora le queda mejor que vayan?"
        vacio="Elegir la hora"
        opciones={franjas}
        valor={franja}
        alElegir={(valor) => {
          setFranja(valor);
          setErrores({ ...errores, franja: "" });
        }}
        error={errores.franja}
      />
      <AreaTexto
        name="nota"
        etiqueta="¿Algo que deban saber? (opcional)"
        rows={3}
        maxLength={300}
        value={nota}
        error={errores.nota}
        onChange={(e) => setNota(e.target.value)}
      />
      {falla && (
        <MensajeEstado tipo="error" titulo="No se envió el pedido">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={Send} anchoCompleto cargando={enviando}>
        Pedir mi recibo
      </Boton>
    </form>
  );
}
