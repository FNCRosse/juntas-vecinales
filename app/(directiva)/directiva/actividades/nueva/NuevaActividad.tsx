"use client";
// @HU-ASA-08

import { ArrowRight, Check, ChevronLeft, ChevronRight, HandHeart } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo, MensajeDeCampo } from "@/componentes/a11y/Campo";
import { CerrarDialogo, Dialogo } from "@/componentes/a11y/Dialogo";
import { Interruptor } from "@/componentes/a11y/Interruptor";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";
import { fechaHoraEnPalabras } from "@/componentes/a11y/SelectorFechaHora";

type Tipo = "POLLADA" | "PARRILLADA" | "BINGO" | "RIFA" | "OTRA";
type Pagos = "AMBOS" | "ANTICIPADO" | "PUERTA";

const TIPOS: { valor: Tipo; etiqueta: string }[] = [
  { valor: "POLLADA", etiqueta: "Pollada" },
  { valor: "PARRILLADA", etiqueta: "Parrillada" },
  { valor: "BINGO", etiqueta: "Bingo" },
  { valor: "RIFA", etiqueta: "Rifa" },
  { valor: "OTRA", etiqueta: "Otra actividad" },
];
const PAGOS: { valor: Pagos; etiqueta: string }[] = [
  { valor: "AMBOS", etiqueta: "Por Yape o Plin y en la puerta" },
  { valor: "ANTICIPADO", etiqueta: "Solo por Yape o Plin" },
  { valor: "PUERTA", etiqueta: "Solo en la puerta" },
];

const VACIOS = { nombre: "", paraQue: "", fecha: "", hora: "", lugar: "", precio: "", meta: "" };

// DIR-ASA-17 y DIR-ASA-18: publicar una actividad pro fondos en dos pasos. Los datos van en una hoja («Datos de la
// actividad») para que la pantalla no pase de los objetivos permitidos (R-11); publicar avisa a toda la
// comunidad y no se deshace, así que lleva su paso de confirmación (R-12).
export function NuevaActividad() {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "publicada">("datos");
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [pagos, setPagos] = useState<Pagos | null>(null);
  const [pideVoluntarios, setPideVoluntarios] = useState<boolean>(false);
  const [datos, setDatos] = useState<typeof VACIOS>(VACIOS);
  const [hojaAbierta, setHojaAbierta] = useState<boolean>(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);
  const idOperacion = useRef<string>(null);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const hayDatos = Boolean(datos.nombre.trim());
  const cuando = fechaHoraEnPalabras(datos.fecha, datos.hora);

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!tipo) nuevos.tipoActividad = "Elija qué actividad es.";
    if (!datos.nombre.trim()) nuevos.nombre = "Escriba el nombre de la actividad.";
    else if (!datos.paraQue.trim()) nuevos.nombre = "Cuente para qué se juntará el dinero.";
    else if (!datos.fecha || !datos.hora) nuevos.nombre = "Indique la fecha y la hora de la actividad.";
    else if (!datos.lugar.trim()) nuevos.nombre = "Escriba el lugar de la actividad.";
    else if (!datos.precio.trim()) nuevos.nombre = "Escriba el precio, por ejemplo 15.";
    if (!pagos) nuevos.pagos = "Elija cómo pueden pagar los vecinos.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function publicar() {
    idOperacion.current ??= crypto.randomUUID();
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson("/api/eventos", "POST", {
      tipoActividad: tipo,
      ...datos,
      pagos,
      pideVoluntarios,
      idOperacion: idOperacion.current,
    });
    setEnviando(false);
    if (r.ok) return setPaso("publicada");
    if (r.estado === 400) {
      // Los errores de un dato de la hoja se muestran junto a la fila «Datos de la actividad».
      const primero = Object.entries(r.campos).find(([campo]) => !["tipoActividad", "pagos"].includes(campo));
      setErrores({
        ...(r.campos.tipoActividad ? { tipoActividad: r.campos.tipoActividad } : {}),
        ...(r.campos.pagos ? { pagos: r.campos.pagos } : {}),
        ...(primero ? { nombre: primero[1] } : {}),
      });
      setPaso("datos");
    } else setFalla(r.error);
  }

  if (paso === "publicada") {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Actividad publicada">
          <p>Los vecinos ya la ven. Aquí puede registrar ingresos y gastos a medida que ocurran.</p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {datos.nombre.trim()}
        </h1>
        <BotonEnlace href="/directiva/asambleas" icono={HandHeart}>
          Volver a asambleas
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo="¿Desea publicar la actividad?"
        filas={[
          ["Actividad", TIPOS.find((t) => t.valor === tipo)?.etiqueta ?? ""],
          ["Nombre", datos.nombre.trim()],
          ["Fecha", cuando],
          ["Lugar", datos.lugar.trim()],
          ["Precio", `S/ ${datos.precio.trim().replace(/^S\/\s*/i, "")}`],
          ["Pagos", PAGOS.find((p) => p.valor === pagos)?.etiqueta ?? ""],
          ["Voluntarios", pideVoluntarios ? "Sí, se piden" : "No"],
        ]}
        efecto="Aparecerá en Actividades pro-fondos de los vecinos, y avisaremos a todas las casas. Después podrá registrar sus ingresos y gastos."
        textoConfirmar="Sí, publicar la actividad"
        enviando={enviando}
        error={falla}
        alConfirmar={publicar}
        alCorregir={() => setPaso("datos")}
        hrefCancelar="/directiva/crear"
      />
    );
  }

  const listaErrores = Object.entries(errores).map(([campo, mensaje]) => ({
    campo: `campo-${campo === "nombre" ? "datos" : campo === "tipoActividad" ? "tipo" : campo}`,
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
        href="/directiva/crear"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Nueva actividad pro-fondos
        </h1>
        <p>Los vecinos la verán en Actividades pro-fondos y podrán anotarse o pagar desde la app.</p>
      </div>
      <ResumenErrores errores={listaErrores} />
      <SelectorEnHoja
        id="campo-tipo"
        pregunta="¿Qué actividad es?"
        vacio="Elegir una opción"
        opciones={TIPOS}
        valor={tipo}
        alElegir={setTipo}
        error={errores.tipoActividad}
      />
      <div className="flex flex-col gap-3">
        <span id="campo-datos-pregunta" className="font-bold">
          Datos de la actividad
        </span>
        <Dialogo
          variante="hoja"
          titulo="Datos de la actividad"
          abierto={hojaAbierta}
          alCambiar={setHojaAbierta}
          disparador={
            <button
              type="button"
              id="campo-datos"
              aria-haspopup="dialog"
              aria-labelledby="campo-datos-pregunta campo-datos"
              aria-describedby={errores.nombre ? "campo-datos-error" : undefined}
              className={`flex min-h-tactil w-full items-center gap-3 rounded-control border-(length:--borde-ancho-control) bg-fondo-superficie px-4 py-2 text-left text-base text-texto-principal cursor-pointer hover:bg-accion-secundaria-hover ${errores.nombre ? "border-borde-error" : "border-borde-control"}`}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <strong>{hayDatos ? datos.nombre.trim() : "Escribir los datos"}</strong>
                {hayDatos && (
                  <span className="text-pequeno text-texto-secundario">
                    {[cuando, datos.lugar.trim(), datos.precio.trim() && `S/ ${datos.precio.trim()}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 font-bold text-texto-enlace">
                {hayDatos ? "Cambiar" : "Escribir"}
                <ChevronRight aria-hidden className="size-icono-pequeno" />
              </span>
            </button>
          }
        >
          <Campo
            name="nombre"
            etiqueta="Nombre de la actividad"
            autoComplete="off"
            maxLength={120}
            value={datos.nombre}
            onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
          />
          <Campo
            name="paraQue"
            etiqueta="¿Para qué se juntará el dinero?"
            autoComplete="off"
            maxLength={300}
            value={datos.paraQue}
            onChange={(e) => setDatos({ ...datos, paraQue: e.target.value })}
          />
          <Campo
            type="date"
            name="fecha"
            etiqueta="Fecha"
            value={datos.fecha}
            onChange={(e) => setDatos({ ...datos, fecha: e.target.value })}
          />
          <Campo
            type="time"
            name="hora"
            etiqueta="Hora"
            value={datos.hora}
            onChange={(e) => setDatos({ ...datos, hora: e.target.value })}
          />
          <Campo
            name="lugar"
            etiqueta="Lugar"
            autoComplete="off"
            maxLength={160}
            value={datos.lugar}
            onChange={(e) => setDatos({ ...datos, lugar: e.target.value })}
          />
          <Campo
            name="precio"
            etiqueta="Precio por plato o boleto (S/)"
            inputMode="decimal"
            autoComplete="off"
            value={datos.precio}
            onChange={(e) => setDatos({ ...datos, precio: e.target.value })}
          />
          <Campo
            name="meta"
            etiqueta="Meta de dinero (opcional, S/)"
            inputMode="decimal"
            autoComplete="off"
            value={datos.meta}
            onChange={(e) => setDatos({ ...datos, meta: e.target.value })}
          />
          <CerrarDialogo asChild>
            <Boton type="button" icono={Check} anchoCompleto>
              Listo
            </Boton>
          </CerrarDialogo>
        </Dialogo>
        {errores.nombre && <MensajeDeCampo id="campo-datos-error">{errores.nombre}</MensajeDeCampo>}
      </div>
      <SelectorEnHoja
        id="campo-pagos"
        pregunta="¿Cómo pueden pagar los vecinos?"
        vacio="Elegir una opción"
        opciones={PAGOS}
        valor={pagos}
        alElegir={setPagos}
        error={errores.pagos}
      />
      <Interruptor
        etiqueta="Pedir voluntarios"
        descripcion="Los vecinos podrán ofrecer su ayuda; usted la aprueba."
        activo={pideVoluntarios}
        alCambiar={setPideVoluntarios}
      />
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar la actividad
      </Boton>
    </form>
  );
}
