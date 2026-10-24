"use client";
// @HU-COB-08 @HU-COB-11

import { ArrowRight, ChevronLeft, FileDown, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import { soles } from "@/compartido/dinero";

type Opcion = { semanas: number; monto: number; titulo: string; detalle: string };
type Medio = { valor: string; etiqueta: string };
type Franja = { valor: string; etiqueta: string; detalle: string; resumen: string };
type Pago = {
  id: string;
  constancia: string;
  monto: number;
  semanas: string;
  estado: string;
  enviado: string;
};
type PedidoDeCobro = {
  id: string;
  numero: string;
  enviado: string;
  monto: number;
  semanas: string;
  donde: string;
  franja: string;
};
type Datos = {
  semanas: string | null;
  medio: string | null;
  archivoId: string;
  archivo: string;
  franja: string | null;
  nota: string;
};

const MENSAJE_FOTO =
  "Falta la foto de su comprobante, o pesa más de 5 MB. Suba una captura de pantalla; si no puede, pida ayuda a una persona.";

// VEC-COB-02, VEC-COB-03 y VEC-COB-04: pagar la cuota con la foto del comprobante, en dos pasos y con su constancia.
// «Cuánto» y «cómo» van en hojas para no pasar de los objetivos permitidos (R-11); mandar el pago avisa a la directiva y
// no se deshace desde aquí, así que lleva su confirmación (R-12). La foto se sube al elegirla.
// Con «En efectivo» no hay foto: la casa pide que la directiva vaya a cobrarle y elige la hora (HU-COB-11, VEC-COB-13).
export function PagarCuota({
  vivienda,
  opciones,
  medios,
  datosDePago,
  medioEnCasa,
  cobroEnCasa,
}: {
  vivienda: string;
  opciones: Opcion[];
  medios: Medio[];
  datosDePago: { yape: string | null; cuenta: string | null };
  medioEnCasa: string;
  cobroEnCasa: { quienPide: string; direccion: string; telefono: string; franjas: Franja[] };
}) {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "enviado" | "pedido">("datos");
  const [datos, setDatos] = useState<Datos>({
    semanas: null,
    medio: null,
    archivoId: "",
    archivo: "",
    franja: null,
    nota: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [subiendo, setSubiendo] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pago, setPago] = useState<Pago | null>(null);
  const [pedido, setPedido] = useState<PedidoDeCobro | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por pago: si se reintenta por una falla de red, no se registra dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const opcion = opciones.find((o) => String(o.semanas) === datos.semanas);
  const medio = medios.find((m) => m.valor === datos.medio);
  const enEfectivo = datos.medio === medioEnCasa;
  const franja = cobroEnCasa.franjas.find((f) => f.valor === datos.franja);

  async function subir(archivo: File) {
    setSubiendo(true);
    setErrores({ ...errores, archivoId: "" });
    const pedido = await enviarJson<{
      id: string;
      url: string;
      metodo: string;
      cabeceras: Record<string, string>;
    }>("/api/archivos", "POST", { uso: "comprobante_pago", tipo: archivo.type, tamano: archivo.size });
    if (!pedido.ok) {
      setSubiendo(false);
      return setErrores({ ...errores, archivoId: MENSAJE_FOTO });
    }
    try {
      const subida = await fetch(pedido.datos.url, {
        method: pedido.datos.metodo,
        headers: pedido.datos.cabeceras,
        body: archivo,
      });
      if (!subida.ok) throw new Error("subida");
    } catch {
      setSubiendo(false);
      return setErrores({
        ...errores,
        archivoId: "No pudimos subir la foto. Revise su internet y vuelva a elegirla.",
      });
    }
    setSubiendo(false);
    setDatos({ ...datos, archivoId: pedido.datos.id, archivo: archivo.name });
  }

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!datos.semanas) nuevos.semanas = "Elija cuánto va a pagar.";
    if (!datos.medio) nuevos.medio = "Elija cómo va a pagar.";
    if (enEfectivo) {
      if (!datos.franja) nuevos.franja = "Elija a qué hora le queda mejor que vayan.";
    } else if (!datos.archivoId) nuevos.archivoId = MENSAJE_FOTO;
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function enviar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    if (enEfectivo) {
      const r = await enviarJson<PedidoDeCobro>("/api/aportes/cobros-en-casa", "POST", {
        semanas: Number(datos.semanas),
        franja: datos.franja,
        nota: datos.nota,
        idOperacion: idOperacion.current,
      });
      setEnviando(false);
      if (r.ok) {
        setPedido(r.datos);
        return setPaso("pedido");
      }
      if (r.estado === 400) {
        setErrores(r.campos);
        setPaso("datos");
      } else setFalla(r.error);
      return;
    }
    const r = await enviarJson<Pago>("/api/aportes/pagos/digital", "POST", {
      semanas: Number(datos.semanas),
      medio: datos.medio,
      archivoId: datos.archivoId,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) {
      setPago(r.datos);
      return setPaso("enviado");
    }
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("datos");
    } else setFalla(r.error);
  }

  async function preferirPagarPorOtroMedio() {
    if (!pedido) return;
    setEnviando(true);
    const r = await enviarJson(`/api/aportes/cobros-en-casa/${pedido.id}/cancelar`, "PATCH");
    setEnviando(false);
    if (!r.ok) return setFalla(r.error);
    // Vuelve a «Pagar mi cuota» con todo en blanco para elegir otro medio.
    idOperacion.current = null;
    setPedido(null);
    setDatos({ semanas: null, medio: null, archivoId: "", archivo: "", franja: null, nota: "" });
    setErrores({});
    setPaso("datos");
  }

  if (paso === "pedido" && pedido) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Pedido enviado a la directiva">
          <p>La directiva la llamará para acordar el día de la visita.</p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Irán a su casa a cobrar
        </h1>
        <section
          aria-label="Su pedido"
          className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
        >
          <p className="text-pequeno text-texto-secundario">
            Pedido N.° {pedido.numero} · {pedido.enviado}
          </p>
          <p className="text-titulo-2">{soles(pedido.monto)}</p>
          <dl className="flex flex-col gap-3">
            {[
              ["Qué paga", pedido.semanas],
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
            Pendiente de visita
          </span>
          <p>La directiva la llamará para confirmar el día.</p>
        </section>
        <ul className="flex list-disc flex-col gap-1 pl-6">
          <li>Tenga listo el monto. Si puede, en sencillo.</li>
          <li>Al pagar, revise que el recibo en papel tenga su nombre, el monto y la firma.</li>
          <li>Su recibo digital aparecerá también en Mis pagos y recibos.</li>
        </ul>
        {falla && (
          <MensajeEstado tipo="error" titulo="No se canceló el pedido">
            <p>{falla}</p>
          </MensajeEstado>
        )}
        <div className="flex flex-col gap-opuestas">
          <BotonEnlace href="/" icono={Home}>
            Volver al inicio
          </BotonEnlace>
          <Boton type="button" variante="secundario" cargando={enviando} onClick={preferirPagarPorOtroMedio}>
            Prefiero pagar por Yape o transferencia
          </Boton>
        </div>
      </div>
    );
  }

  if (paso === "enviado" && pago) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo={`Enviado el ${pago.enviado}`}>
          <p>Avisamos a la directiva que llegó su comprobante.</p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Recibimos su pago
        </h1>
        <section
          aria-label="Constancia de envío"
          className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
        >
          <p className="text-pequeno text-texto-secundario">Constancia de envío N.° {pago.constancia}</p>
          <p className="text-titulo-2">{soles(pago.monto)}</p>
          <p>{pago.semanas}</p>
          <span className="inline-flex self-start rounded-pastilla border border-borde-info bg-fondo-info px-3 text-pequeno font-bold text-texto-info">
            Pendiente de revisión
          </span>
        </section>
        <BotonEnlace href={`/api/aportes/pagos/${pago.id}/constancia`} variante="secundario" icono={FileDown}>
          Descargar constancia (PDF)
        </BotonEnlace>
        <p>Cuando la directiva valide su pago, le llegará su recibo oficial en Mis pagos y recibos.</p>
        <BotonEnlace href="/" icono={Home}>
          Volver al inicio
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={enEfectivo ? "¿Desea pedir que vayan a cobrar?" : "¿Desea enviar este pago?"}
        filas={
          enEfectivo
            ? [
                ["Monto", soles(opcion?.monto ?? 0)],
                ["Qué paga", opcion?.detalle ?? ""],
                ["Cómo pagó", "En efectivo, en su casa"],
                ["Dónde", `En su casa, ${cobroEnCasa.direccion}`],
                ["Hora preferida", franja?.resumen ?? ""],
                ["Para", `Junta Vecinal · ${vivienda}`],
              ]
            : [
                ["Monto", soles(opcion?.monto ?? 0)],
                ["Qué paga", opcion?.detalle ?? ""],
                ["Cómo pagó", medio?.etiqueta ?? ""],
                ["Comprobante", datos.archivo],
                ["Para", `Junta Vecinal · ${vivienda}`],
              ]
        }
        efecto={
          enEfectivo
            ? "Enviaremos su pedido a la directiva. La directiva la llamará para acordar el día de la visita. Todavía no se cobra nada."
            : "Al enviarlo, la directiva revisará su comprobante. Mientras tanto, su pago figura como en revisión. Si algo no está bien, puede corregirlo o cancelar ahora."
        }
        textoConfirmar={enEfectivo ? "Sí, pedir que vengan a cobrar" : "Sí, enviar mi pago"}
        enviando={enviando}
        error={falla}
        alConfirmar={enviar}
        alCorregir={() => setPaso("datos")}
        hrefCancelar="/cuota"
        textoCancelar="Cancelar, no enviar nada"
      />
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
        revisar();
      }}
      className="flex flex-col gap-6"
    >
      <Link
        href="/cuota"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Mi cuota
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Pagar mi cuota
        </h1>
      </div>
      <ResumenErrores errores={listaErrores} />
      <SelectorEnHoja
        id="campo-semanas"
        pregunta="¿Cuánto va a pagar?"
        vacio="Elegir cuánto"
        opciones={opciones.map((o) => ({
          valor: String(o.semanas),
          etiqueta: `${o.titulo}: ${soles(o.monto)}`,
          detalle: o.detalle,
        }))}
        valor={datos.semanas}
        alElegir={(valor) => {
          setDatos({ ...datos, semanas: valor });
          setErrores({ ...errores, semanas: "" });
        }}
        error={errores.semanas}
      />
      <SelectorEnHoja
        id="campo-medio"
        pregunta="¿Cómo va a pagar?"
        vacio="Elegir cómo"
        opciones={medios.map((m) => ({ valor: m.valor, etiqueta: m.etiqueta }))}
        valor={datos.medio}
        alElegir={(valor) => {
          setDatos({ ...datos, medio: valor });
          setErrores({ ...errores, medio: "" });
        }}
        error={errores.medio}
      />
      {enEfectivo ? (
        <>
          <p>
            Una persona de la directiva irá a su casa a recibir el dinero y le entregará su recibo firmado.
            Revise que estos datos estén bien.
          </p>
          <div className="flex flex-col gap-1">
            <p>
              <strong>Quién pide:</strong> {cobroEnCasa.quienPide}
            </p>
            <p>
              <strong>Dirección:</strong> {cobroEnCasa.direccion}
            </p>
            <p>
              <strong>Teléfono:</strong> {cobroEnCasa.telefono}
            </p>
          </div>
          <SelectorEnHoja
            id="campo-franja"
            pregunta="¿A qué hora le queda mejor que vayan?"
            vacio="Elegir la hora"
            opciones={cobroEnCasa.franjas.map((f) => ({
              valor: f.valor,
              etiqueta: f.etiqueta,
              detalle: f.detalle,
            }))}
            valor={datos.franja}
            alElegir={(valor) => {
              setDatos({ ...datos, franja: valor });
              setErrores({ ...errores, franja: "" });
            }}
            error={errores.franja}
          />
          <AreaTexto
            name="nota"
            etiqueta="¿Algo que deban saber? (opcional)"
            rows={3}
            maxLength={300}
            value={datos.nota}
            error={errores.nota}
            onChange={(e) => setDatos({ ...datos, nota: e.target.value })}
          />
        </>
      ) : (
        <>
          <section aria-labelledby="titulo-datos-pago" className="flex flex-col gap-2">
            <h2 id="titulo-datos-pago" className="text-titulo-3">
              Datos para pagar
            </h2>
            {datosDePago.yape && <p>Yape o Plin: {datosDePago.yape}</p>}
            {datosDePago.cuenta && <p>Cuenta bancaria: {datosDePago.cuenta}</p>}
            {!datosDePago.yape && !datosDePago.cuenta && <p>La directiva le dirá dónde pagar.</p>}
          </section>
          <Campo
            type="file"
            name="archivoId"
            etiqueta="Foto de su comprobante"
            accept="image/jpeg,image/png,application/pdf"
            ayuda={
              subiendo
                ? "Subiendo la foto…"
                : datos.archivo
                  ? `Foto cargada: ${datos.archivo}`
                  : "Una captura de pantalla clara. Puede ser JPG, PNG o PDF de hasta 5 MB."
            }
            error={errores.archivoId}
            disabled={subiendo}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) void subir(archivo);
            }}
          />
        </>
      )}
      <Boton type="submit" icono={ArrowRight} anchoCompleto cargando={subiendo}>
        {enEfectivo ? "Revisar mi pedido" : "Revisar mi pago"}
      </Boton>
    </form>
  );
}
