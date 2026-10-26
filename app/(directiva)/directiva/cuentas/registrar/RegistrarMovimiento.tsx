"use client";
// @HU-COB-14

import { ArrowRight, ChevronLeft, ListChecks, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import { aCentimos, soles } from "@/compartido/dinero";

type Tipo = "GASTO" | "INGRESO";
type Concepto = { valor: string; etiqueta: string };

const hoyEnLima = () =>
  new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

// DIR-TRA-03 y DIR-TRA-04: registrar un ingreso o un gasto de la caja de vigilancia, en dos pasos. Es plata y no se borra después
// (se corrige con otro movimiento), así que lleva su confirmación (R-12). Un gasto lleva la foto de su comprobante, que se sube al
// elegirla.
export function RegistrarMovimiento({
  conceptos,
}: {
  conceptos: { GASTO: Concepto[]; INGRESO: Concepto[] };
}) {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "registrado">("datos");
  const [tipo, setTipo] = useState<Tipo>("GASTO");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState<string | null>(null);
  const [detalle, setDetalle] = useState("");
  const [archivo, setArchivo] = useState({ id: "", nombre: "", subiendo: false, falla: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por movimiento: si se reintenta por una falla de red, no se registra dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const esGasto = tipo === "GASTO";
  const centimos = aCentimos(monto);
  const etiquetaDelConcepto = conceptos[tipo].find((c) => c.valor === concepto)?.etiqueta ?? "";

  async function subirFoto(foto: File) {
    setArchivo({ id: "", nombre: "", subiendo: true, falla: "" });
    const pedido = await enviarJson<{
      id: string;
      url: string;
      metodo: string;
      cabeceras: Record<string, string>;
    }>("/api/archivos", "POST", { uso: "comprobante_egreso", tipo: foto.type, tamano: foto.size });
    if (!pedido.ok)
      return setArchivo({
        id: "",
        nombre: "",
        subiendo: false,
        falla: pedido.campos.archivo ?? pedido.error,
      });
    try {
      const r = await fetch(pedido.datos.url, { method: "PUT", headers: pedido.datos.cabeceras, body: foto });
      if (!r.ok) throw new Error();
      setArchivo({ id: pedido.datos.id, nombre: foto.name, subiendo: false, falla: "" });
    } catch {
      setArchivo({
        id: "",
        nombre: "",
        subiendo: false,
        falla: "No pudimos subir la foto. Revise su internet y vuelva a elegirla.",
      });
    }
  }

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!monto.trim() || centimos === null || centimos === 0) {
      nuevos.monto =
        monto.trim() && centimos === null
          ? "Escriba un monto en soles, por ejemplo 150.50."
          : "Escriba cuánto fue.";
    }
    if (!concepto) nuevos.concepto = esGasto ? "Elija en qué se gastó." : "Elija de dónde viene.";
    if (esGasto && archivo.subiendo) nuevos.archivoId = "Espere a que termine de subir la foto.";
    else if (esGasto && !archivo.id) nuevos.archivoId = "Adjunte la foto del comprobante del gasto.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function registrar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson("/api/transparencia/movimientos", "POST", {
      tipo,
      monto: centimos,
      concepto,
      detalle,
      archivoId: esGasto ? archivo.id : undefined,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) return setPaso("registrado");
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("datos");
    } else setFalla(r.error);
  }

  if (paso === "registrado") {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo={esGasto ? "Gasto registrado" : "Ingreso registrado"}>
          <p>Ya está en la rendición de cuentas y en el historial de la directiva.</p>
        </MensajeEstado>
        <div className="flex flex-col gap-opuestas">
          <BotonEnlace href="/directiva/cuentas/movimientos" icono={ListChecks}>
            Ver todos los ingresos y gastos
          </BotonEnlace>
          <BotonEnlace href="/directiva/cuentas" variante="secundario" icono={Plus}>
            Volver a la rendición
          </BotonEnlace>
        </div>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={esGasto ? "¿Desea registrar este gasto?" : "¿Desea registrar este ingreso?"}
        filas={[
          ["Monto", soles(centimos ?? 0)],
          ["Tipo", esGasto ? "Gasto" : "Ingreso"],
          ["Concepto", etiquetaDelConcepto],
          ...(detalle.trim() ? [["Detalle", detalle.trim()] as [string, string]] : []),
          ["Cuenta", "Caja de vigilancia"],
          ["Fecha", `Hoy, ${hoyEnLima()}`],
          ["Comprobante", esGasto ? archivo.nombre : "No lleva"],
        ]}
        efecto="Se sumará a la rendición de cuentas y al historial de la directiva. Si se equivoca, podrá registrar una corrección, pero no borrarlo."
        textoConfirmar={esGasto ? "Sí, registrar el gasto" : "Sí, registrar el ingreso"}
        enviando={enviando}
        error={falla}
        alConfirmar={registrar}
        alCorregir={() => setPaso("datos")}
        hrefCancelar="/directiva/cuentas"
      />
    );
  }

  // Los errores se vuelven a calcular al pulsar «Revisar», no al escribir: el resumen toma el foco cada vez que cambia y sacaría el cursor del campo.
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
        href="/directiva/cuentas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Registrar un ingreso o gasto
        </h1>
        <p>Las cuotas de vigilancia se suman solas con cada recibo. Aquí se anota todo lo demás.</p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <SelectorEnHoja<Tipo>
        id="campo-tipo"
        pregunta="¿Qué va a registrar?"
        opciones={[
          { valor: "GASTO", etiqueta: "Gasto" },
          { valor: "INGRESO", etiqueta: "Ingreso" },
        ]}
        valor={tipo}
        alElegir={(t) => {
          setTipo(t);
          setConcepto(null);
          setErrores({});
        }}
      />
      <Campo
        name="monto"
        etiqueta="¿Cuánto fue? (en soles)"
        ayuda="Por ejemplo 35.50."
        inputMode="decimal"
        autoComplete="off"
        value={monto}
        error={errores.monto}
        onChange={(e) => setMonto(e.target.value)}
      />
      <SelectorEnHoja
        id="campo-concepto"
        pregunta={esGasto ? "¿En qué se gastó?" : "¿De dónde viene?"}
        vacio="Elegir una opción"
        opciones={conceptos[tipo]}
        valor={concepto}
        alElegir={setConcepto}
        error={errores.concepto}
      />
      <Campo
        name="detalle"
        etiqueta="Detalle (opcional)"
        ayuda="Por ejemplo: foco LED para la garita."
        maxLength={120}
        autoComplete="off"
        value={detalle}
        error={errores.detalle}
        onChange={(e) => setDetalle(e.target.value)}
      />
      {esGasto && (
        <Campo
          name="archivoId"
          etiqueta="Foto o archivo del comprobante"
          ayuda={
            archivo.subiendo
              ? "Subiendo la foto…"
              : archivo.nombre
                ? `Foto cargada: ${archivo.nombre}`
                : "Puede tomar una foto de la boleta con el teléfono. JPG, PNG o PDF de hasta 5 MB."
          }
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          error={errores.archivoId ?? (archivo.falla || undefined)}
          onChange={(e) => {
            const foto = e.target.files?.[0];
            if (foto) void subirFoto(foto);
          }}
        />
      )}
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar
      </Boton>
    </form>
  );
}
