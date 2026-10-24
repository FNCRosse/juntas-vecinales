"use client";
// @HU-COB-03

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { AreaTexto } from "@/componentes/a11y/AreaTexto";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";

type Motivo = { valor: string; etiqueta: string };

const MENSAJE_DOCUMENTO =
  "El documento tiene que ser una foto o un PDF de hasta 5 MB. Si no puede subirlo, envíe el reclamo sin él.";

// VEC-COB-08 y VEC-COB-09: reclamar el monto de la cuota, en dos pasos. El motivo va en una hoja para no pasar de los objetivos
// permitidos (R-11). El reclamo cambia el estado de la cuota y avisa a la directiva, así que lleva su confirmación (R-12); el
// documento se sube al elegirlo y es opcional. Al enviarlo se pasa a VEC-COB-10.
export function Reclamar({ cuota, motivos }: { cuota: string; motivos: Motivo[] }) {
  const router = useRouter();
  const [paso, setPaso] = useState<"datos" | "confirmar">("datos");
  const [motivo, setMotivo] = useState<string | null>(null);
  const [detalle, setDetalle] = useState("");
  const [archivo, setArchivo] = useState<{ id: string; nombre: string } | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por reclamo: si se reintenta por una falla de red, no se envía dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const etiquetaDelMotivo = motivos.find((m) => m.valor === motivo)?.etiqueta ?? "";

  async function subir(foto: File) {
    setSubiendo(true);
    setArchivo(null);
    setErrores({ ...errores, archivoId: "" });
    const pedido = await enviarJson<{
      id: string;
      url: string;
      metodo: string;
      cabeceras: Record<string, string>;
    }>("/api/archivos", "POST", { uso: "sustento_reclamo", tipo: foto.type, tamano: foto.size });
    if (!pedido.ok) {
      setSubiendo(false);
      return setErrores({ ...errores, archivoId: MENSAJE_DOCUMENTO });
    }
    try {
      const subida = await fetch(pedido.datos.url, {
        method: pedido.datos.metodo,
        headers: pedido.datos.cabeceras,
        body: foto,
      });
      if (!subida.ok) throw new Error("subida");
      setArchivo({ id: pedido.datos.id, nombre: foto.name });
    } catch {
      setErrores({
        ...errores,
        archivoId:
          "No pudimos subir el documento. Revise su internet y vuelva a elegirlo, o envíe el reclamo sin él.",
      });
    }
    setSubiendo(false);
  }

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!motivo) nuevos.motivo = "Elija por qué cree que su cuota no es correcta.";
    if (motivo === "OTRO" && !detalle.trim()) nuevos.detalle = "Cuéntenos cuál es el motivo.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function enviar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<{ id: string }>("/api/aportes/ajustes", "POST", {
      motivo,
      detalle,
      archivoId: archivo?.id,
      idOperacion: idOperacion.current,
    });
    if (r.ok) return router.push(`/cuota/reclamo/${r.datos.id}?enviado=1`);
    setEnviando(false);
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("datos");
    } else setFalla(r.error);
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea enviar este reclamo?"
        filas={[
          ["Cuota", cuota.split(" (")[0]],
          ["Motivo", etiquetaDelMotivo],
          ...(detalle.trim() ? [["Lo que contó", detalle.trim()] as [string, string]] : []),
          ["Documento", archivo?.nombre ?? "Sin documento"],
        ]}
        efecto="La directiva lo revisará y le responderá. Mientras tanto no tiene que pagar la diferencia que reclama. Puede cancelar ahora sin problema."
        textoConfirmar="Sí, enviar mi reclamo"
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
          Reclamo sobre mi cuota
        </h1>
        <p>Cuota que reclama: {cuota}. Ya tenemos sus datos.</p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <SelectorEnHoja
        id="campo-motivo"
        pregunta="¿Por qué cree que no es correcta?"
        vacio="Elegir el motivo"
        opciones={motivos}
        valor={motivo}
        alElegir={(valor) => {
          setMotivo(valor);
          setErrores({ ...errores, motivo: "" });
        }}
        error={errores.motivo}
      />
      <AreaTexto
        name="detalle"
        etiqueta={motivo === "OTRO" ? "Cuéntenos cuál es el motivo" : "Cuéntenos un poco más (opcional)"}
        rows={3}
        maxLength={300}
        value={detalle}
        error={errores.detalle}
        onChange={(e) => {
          setDetalle(e.target.value);
          setErrores({ ...errores, detalle: "" });
        }}
      />
      <Campo
        type="file"
        name="archivoId"
        etiqueta="Documento que lo respalde (opcional)"
        accept="image/jpeg,image/png,application/pdf"
        ayuda={
          subiendo
            ? "Subiendo el documento…"
            : archivo
              ? `Documento cargado: ${archivo.nombre}`
              : "Por ejemplo, el contrato terminado o un recibo. Foto o PDF de hasta 5 MB."
        }
        error={errores.archivoId}
        disabled={subiendo}
        onChange={(e) => {
          const foto = e.target.files?.[0];
          if (foto) void subir(foto);
        }}
      />
      <Boton type="submit" icono={ArrowRight} anchoCompleto cargando={subiendo}>
        Revisar mi reclamo
      </Boton>
    </form>
  );
}
