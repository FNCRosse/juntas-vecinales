"use client";
// @HU-ASA-10

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { Volver } from "@/componentes/a11y/Volver";
import { aCentimos, soles } from "@/compartido/dinero";

type Tipo = "GASTO" | "INGRESO_EN_PUERTA";
const TIPOS: Record<Tipo, string> = {
  GASTO: "Un gasto, con la foto de su comprobante",
  INGRESO_EN_PUERTA: "Lo cobrado en la puerta el día de la actividad",
};
const MENSAJE_MONTO = "Escriba un monto en soles, por ejemplo 150.50.";

// DIR-ASA-12 (prototipo DAS09, «Registrar un gasto o ingreso de la actividad»): dos pasos y una sola confirmación (R-12).
// Al guardar vuelve a las cuentas de la actividad, donde ya aparece.
export function RegistrarMovimiento({ actividadId, nombre }: { actividadId: string; nombre: string }) {
  const router = useRouter();
  const volver = `/directiva/actividades/${actividadId}`;
  const [paso, setPaso] = useState<"anotar" | "confirmar">("anotar");
  const [datos, setDatos] = useState({ tipo: "GASTO" as Tipo, concepto: "", monto: "" });
  const [foto, setFoto] = useState({ archivoId: "", nombre: "", subiendo: false, falla: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  // Un identificador por anotación: si se reintenta por una falla de red, no se guarda dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  async function subirFoto(archivo: File) {
    setFoto({ archivoId: "", nombre: "", subiendo: true, falla: "" });
    const pedido = await enviarJson<{ id: string; url: string; cabeceras: Record<string, string> }>(
      "/api/archivos",
      "POST",
      { uso: "comprobante_egreso", tipo: archivo.type, tamano: archivo.size },
    );
    if (!pedido.ok) {
      return setFoto({
        archivoId: "",
        nombre: "",
        subiendo: false,
        falla: pedido.campos.archivo ?? pedido.error,
      });
    }
    try {
      const r = await fetch(pedido.datos.url, {
        method: "PUT",
        headers: pedido.datos.cabeceras,
        body: archivo,
      });
      if (!r.ok) throw new Error();
      setFoto({ archivoId: pedido.datos.id, nombre: archivo.name, subiendo: false, falla: "" });
    } catch {
      setFoto({
        archivoId: "",
        nombre: "",
        subiendo: false,
        falla: "No pudimos subir la foto. Revise su internet y vuelva a elegirla.",
      });
    }
  }

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!datos.concepto.trim()) nuevos.concepto = "Escriba en qué se gastó o qué se cobró.";
    const monto = aCentimos(datos.monto);
    if (!datos.monto.trim()) nuevos.monto = "Escriba cuánto fue.";
    else if (monto === null || monto <= 0) nuevos.monto = MENSAJE_MONTO;
    if (datos.tipo === "GASTO") {
      if (foto.subiendo) nuevos.archivoId = "Espere a que termine de subir la foto.";
      else if (!foto.archivoId) nuevos.archivoId = "Adjunte la foto del comprobante de este gasto.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function guardar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/eventos/${actividadId}/movimientos`, "POST", {
      tipo: datos.tipo,
      concepto: datos.concepto,
      monto: aCentimos(datos.monto),
      archivoId: datos.tipo === "GASTO" ? foto.archivoId : null,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) {
      router.push(volver);
      return router.refresh();
    }
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("anotar");
    } else setFalla(r.error);
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={
          datos.tipo === "GASTO" ? "¿Desea anotar este gasto?" : "¿Desea anotar lo cobrado en la puerta?"
        }
        filas={[
          ["Actividad", nombre],
          [datos.tipo === "GASTO" ? "En qué se gastó" : "Qué se cobró", datos.concepto.trim()],
          ["Monto", soles(aCentimos(datos.monto) ?? 0)],
          ...(datos.tipo === "GASTO" ? [["Comprobante", foto.nombre] as [string, string]] : []),
        ]}
        efecto="Se sumará a las cuentas de la actividad y al balance cuando lo publique. Un monto mal anotado se corrige con otra anotación."
        textoConfirmar={datos.tipo === "GASTO" ? "Sí, anotar el gasto" : "Sí, anotar lo cobrado"}
        enviando={enviando}
        error={falla}
        alConfirmar={guardar}
        alCorregir={() => setPaso("anotar")}
        hrefCancelar={volver}
      />
    );
  }

  const listaErrores = Object.entries(errores).map(([campo, mensaje]) => ({
    campo: `campo-${campo}`,
    mensaje,
  }));
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        revisar();
      }}
      className="flex flex-col gap-6"
    >
      <Volver href={volver}>Volver a la actividad</Volver>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Registrar un gasto o ingreso
        </h1>
        <p>{nombre}</p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <GrupoOpciones id="campo-tipo" pregunta="¿Qué va a anotar?" error={errores.tipo}>
        {(Object.keys(TIPOS) as Tipo[]).map((clave) => (
          <Opcion
            key={clave}
            tipo="radio"
            name="tipo"
            etiqueta={TIPOS[clave]}
            checked={datos.tipo === clave}
            onChange={() => setDatos({ ...datos, tipo: clave })}
          />
        ))}
      </GrupoOpciones>
      <Campo
        name="concepto"
        etiqueta={datos.tipo === "GASTO" ? "¿En qué se gastó?" : "¿Qué se cobró?"}
        ayuda={
          datos.tipo === "GASTO"
            ? "Por ejemplo: Pollos (40 unidades)"
            : "Por ejemplo: 52 platos vendidos en la puerta"
        }
        autoComplete="off"
        maxLength={80}
        value={datos.concepto}
        error={errores.concepto}
        onChange={(e) => setDatos({ ...datos, concepto: e.target.value })}
      />
      <Campo
        name="monto"
        etiqueta="¿Cuánto fue? (en soles)"
        inputMode="decimal"
        autoComplete="off"
        value={datos.monto}
        error={errores.monto}
        onChange={(e) => setDatos({ ...datos, monto: e.target.value })}
      />
      {datos.tipo === "GASTO" && (
        <Campo
          name="archivoId"
          etiqueta="Foto del comprobante"
          ayuda={
            foto.subiendo
              ? "Subiendo la foto…"
              : foto.nombre
                ? `Foto cargada: ${foto.nombre}`
                : "Una foto (JPG o PNG) o un PDF de hasta 5 MB."
          }
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          error={errores.archivoId ?? (foto.falla || undefined)}
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) void subirFoto(archivo);
          }}
        />
      )}
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar lo anotado
      </Boton>
    </form>
  );
}
