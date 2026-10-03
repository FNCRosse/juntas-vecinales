"use client";
// @HU-ASA-10

import { ArrowRight, ChevronLeft, FileText, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { GraficoBalance } from "@/componentes/a11y/GraficoBalance";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { aCentimos, soles } from "@/compartido/dinero";
import { calcularTotales } from "@/modulos/transparencia/aplicacion/totales";

const hoyEnLima = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());
const MENSAJE_MONTO = "Escriba un monto en soles, por ejemplo 150.50.";

type Gasto = {
  clave: number;
  concepto: string;
  monto: string;
  archivoId: string;
  archivo: string;
  subiendo: boolean;
  falla: string;
};
const nuevoGasto = (clave: number): Gasto => ({
  clave,
  concepto: "",
  monto: "",
  archivoId: "",
  archivo: "",
  subiendo: false,
  falla: "",
});

export function PublicarBalance() {
  const [paso, setPaso] = useState<"registrar" | "confirmar" | "publicado">("registrar");
  const [datos, setDatos] = useState({
    titulo: "",
    fechaActividad: "",
    ingresosVirtuales: "",
    ingresosEnPuerta: "",
  });
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [totalesPublicados, setTotalesPublicados] = useState<ReturnType<typeof calcularTotales> | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  const siguienteClave = useRef(1);
  // Un identificador por balance: si se reintenta por una falla de red, no se publica dos veces (AC-5).
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const virtuales = aCentimos(datos.ingresosVirtuales || "0");
  const enPuerta = aCentimos(datos.ingresosEnPuerta || "0");
  const montos = gastos.map((g) => aCentimos(g.monto) ?? 0);
  const totales = calcularTotales({
    ingresosVirtuales: virtuales ?? 0,
    ingresosEnPuerta: enPuerta ?? 0,
    egresos: montos.map((monto) => ({ monto })),
  });

  const cambiarGasto = (clave: number, cambios: Partial<Gasto>) =>
    setGastos((lista) => lista.map((g) => (g.clave === clave ? { ...g, ...cambios } : g)));

  async function subirFoto(clave: number, archivo: File) {
    cambiarGasto(clave, { subiendo: true, falla: "", archivoId: "", archivo: "" });
    const pedido = await enviarJson<{
      id: string;
      url: string;
      metodo: string;
      cabeceras: Record<string, string>;
    }>("/api/archivos", "POST", { uso: "comprobante_egreso", tipo: archivo.type, tamano: archivo.size });
    if (!pedido.ok) {
      return cambiarGasto(clave, { subiendo: false, falla: pedido.campos.archivo ?? pedido.error });
    }
    try {
      const r = await fetch(pedido.datos.url, {
        method: "PUT",
        headers: pedido.datos.cabeceras,
        body: archivo,
      });
      if (!r.ok) throw new Error();
      cambiarGasto(clave, { subiendo: false, archivoId: pedido.datos.id, archivo: archivo.name });
    } catch {
      cambiarGasto(clave, {
        subiendo: false,
        falla: "No pudimos subir la foto. Revise su internet y vuelva a elegirla.",
      });
    }
  }

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!datos.titulo.trim()) nuevos.titulo = "Escriba el nombre de la actividad.";
    if (!datos.fechaActividad) nuevos.fechaActividad = "Elija la fecha de la actividad.";
    if (virtuales === null) nuevos.ingresosVirtuales = MENSAJE_MONTO;
    if (enPuerta === null) nuevos.ingresosEnPuerta = MENSAJE_MONTO;
    gastos.forEach((g, i) => {
      if (!g.concepto.trim()) nuevos[`egresos.${i}.concepto`] = "Escriba en qué se gastó.";
      const monto = aCentimos(g.monto);
      if (monto === null)
        nuevos[`egresos.${i}.monto`] = g.monto.trim() ? MENSAJE_MONTO : "Escriba cuánto se gastó.";
      else if (monto === 0) nuevos[`egresos.${i}.monto`] = "Escriba cuánto se gastó.";
      if (g.subiendo) nuevos[`egresos.${i}.archivoId`] = "Espere a que termine de subir la foto.";
      else if (!g.archivoId)
        nuevos[`egresos.${i}.archivoId`] = "Adjunte la foto del comprobante de este gasto.";
    });
    if (totales.ingresos === 0 && gastos.length === 0)
      nuevos.movimientos = "Registre al menos un ingreso o un gasto.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function publicar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson("/api/transparencia/balances", "POST", {
      titulo: datos.titulo,
      fechaActividad: datos.fechaActividad,
      ingresosVirtuales: virtuales ?? 0,
      ingresosEnPuerta: enPuerta ?? 0,
      egresos: gastos.map((g, i) => ({ concepto: g.concepto, monto: montos[i], archivoId: g.archivoId })),
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) {
      setTotalesPublicados(totales);
      return setPaso("publicado");
    }
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("registrar");
    } else setFalla(r.error);
  }

  if (paso === "publicado" && totalesPublicados) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Balance publicado">
          <p>Está en Actas y balances y avisamos a todos los vecinos. Ya no se puede modificar.</p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {datos.titulo.trim()}
        </h1>
        <GraficoBalance totales={totalesPublicados} />
        <BotonEnlace href="/directiva" icono={FileText}>
          Volver al resumen
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea publicar el balance?"
        filas={[
          ["Actividad", datos.titulo.trim()],
          ["Ingresos", soles(totales.ingresos)],
          [
            "Gastos",
            `${soles(totales.egresos)} en ${gastos.length} ${gastos.length === 1 ? "gasto" : "gastos"}`,
          ],
          ["Utilidad neta", soles(totales.utilidadNeta)],
          ["Llega a", "Todos los vecinos"],
        ]}
        efecto="Se publicará en Actas y balances y avisaremos a todos los vecinos. Una vez publicado ya no se puede cambiar: si hay un error, se publica uno nuevo."
        textoConfirmar="Sí, publicar el balance"
        enviando={enviando}
        error={falla}
        alConfirmar={publicar}
        alCorregir={() => setPaso("registrar")}
        hrefCancelar="/directiva"
      />
    );
  }

  const listaErrores = Object.entries(errores).map(([campo, mensaje]) => ({
    campo: campo.startsWith("egresos.") ? `gasto-${campo.slice(8).replace(".", "-")}` : `campo-${campo}`,
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
      <Link
        href="/directiva"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al resumen
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Balance de una actividad
        </h1>
        <p>Registre lo que se recaudó y lo que se gastó. Cada gasto lleva la foto de su comprobante.</p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <Campo
        name="titulo"
        etiqueta="Nombre de la actividad"
        ayuda="Por ejemplo: Pollada pro fondos de setiembre."
        autoComplete="off"
        maxLength={120}
        value={datos.titulo}
        error={errores.titulo}
        onChange={(e) => setDatos({ ...datos, titulo: e.target.value })}
      />
      <Campo
        name="fechaActividad"
        etiqueta="Fecha de la actividad"
        type="date"
        max={hoyEnLima()}
        value={datos.fechaActividad}
        error={errores.fechaActividad}
        onChange={(e) => setDatos({ ...datos, fechaActividad: e.target.value })}
      />
      <Campo
        name="ingresosVirtuales"
        etiqueta="Ingresos virtuales (Yape, Plin, transferencias)"
        ayuda="En soles. Por ejemplo: 1200.50. Déjelo vacío si no hubo."
        inputMode="decimal"
        autoComplete="off"
        value={datos.ingresosVirtuales}
        error={errores.ingresosVirtuales}
        onChange={(e) => setDatos({ ...datos, ingresosVirtuales: e.target.value })}
      />
      <Campo
        name="ingresosEnPuerta"
        etiqueta="Ingresos en puerta (efectivo)"
        ayuda="En soles. Déjelo vacío si no hubo."
        inputMode="decimal"
        autoComplete="off"
        value={datos.ingresosEnPuerta}
        error={errores.ingresosEnPuerta}
        onChange={(e) => setDatos({ ...datos, ingresosEnPuerta: e.target.value })}
      />

      <section aria-labelledby="titulo-gastos" className="flex flex-col gap-4">
        <h2 id="titulo-gastos" className="text-titulo-2">
          Gastos
        </h2>
        {gastos.length === 0 && <p className="text-texto-secundario">Todavía no registró gastos.</p>}
        {gastos.map((g, i) => (
          <fieldset
            key={g.clave}
            className="flex flex-col gap-4 rounded-tarjeta border border-borde-sutil p-4 senior:p-6"
          >
            <legend className="px-2 font-bold">Gasto {i + 1}</legend>
            <Campo
              name={`gasto-${i}-concepto`}
              etiqueta="¿En qué se gastó?"
              ayuda="Por ejemplo: pollos, sonido, alquiler de sillas."
              autoComplete="off"
              maxLength={80}
              value={g.concepto}
              error={errores[`egresos.${i}.concepto`]}
              onChange={(e) => cambiarGasto(g.clave, { concepto: e.target.value })}
            />
            <Campo
              name={`gasto-${i}-monto`}
              etiqueta="¿Cuánto fue? (en soles)"
              inputMode="decimal"
              autoComplete="off"
              value={g.monto}
              error={errores[`egresos.${i}.monto`]}
              onChange={(e) => cambiarGasto(g.clave, { monto: e.target.value })}
            />
            <Campo
              name={`gasto-${i}-archivoId`}
              etiqueta="Foto del comprobante"
              ayuda={
                g.subiendo
                  ? "Subiendo la foto…"
                  : g.archivo
                    ? `Foto cargada: ${g.archivo}`
                    : "Una foto (JPG o PNG) o un PDF de hasta 5 MB."
              }
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              error={errores[`egresos.${i}.archivoId`] ?? (g.falla || undefined)}
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) void subirFoto(g.clave, archivo);
              }}
            />
            <Boton
              type="button"
              variante="secundario"
              icono={Trash2}
              onClick={() => setGastos((lista) => lista.filter((x) => x.clave !== g.clave))}
            >
              {`Quitar el gasto ${i + 1}`}
            </Boton>
          </fieldset>
        ))}
        <Boton
          type="button"
          variante="secundario"
          icono={Plus}
          onClick={() => setGastos((lista) => [...lista, nuevoGasto(siguienteClave.current++)])}
        >
          Agregar un gasto
        </Boton>
      </section>

      <GraficoBalance totales={totales} titulo="Así va el balance" />
      {errores.movimientos && (
        <MensajeEstado tipo="error" titulo="Falta un dato">
          <p>{errores.movimientos}</p>
        </MensajeEstado>
      )}
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar el balance
      </Boton>
    </form>
  );
}
