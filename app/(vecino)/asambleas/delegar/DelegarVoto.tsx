"use client";
// @HU-ASA-06

import { ArrowRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { Boton } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { SelectorEnHoja } from "@/componentes/a11y/SelectorEnHoja";

type Condicion = "FAMILIAR" | "VECINO" | "EXTERNO";
const CONDICIONES: { valor: Condicion; etiqueta: string }[] = [
  { valor: "FAMILIAR", etiqueta: "Familiar" },
  { valor: "VECINO", etiqueta: "Vecino o vecina del barrio" },
  { valor: "EXTERNO", etiqueta: "Otra persona" },
];
const EN_TEXTO: Record<Condicion, string> = {
  FAMILIAR: "familiar",
  VECINO: "vecino o vecina del barrio",
  EXTERNO: "otra persona",
};

// VEC-ASA-03 y VEC-ASA-04: delegar el voto en dos pasos. Delegar le da a otra persona el permiso de votar por la
// casa, así que lleva su paso de confirmación (R-12); la delegación registrada (VEC-ASA-05) la muestra la página.
export function DelegarVoto({
  asambleaId,
  titular,
  asambleaEnPalabras,
  plazoEnPalabras,
}: {
  asambleaId: string;
  titular: string;
  /** «sábado 10 de octubre de 2026». */
  asambleaEnPalabras: string;
  /** «viernes 9 de octubre». */
  plazoEnPalabras: string;
}) {
  const router = useRouter();
  const [paso, setPaso] = useState<"redactar" | "confirmar">("redactar");
  const [datos, setDatos] = useState({ nombre: "", dni: "", condicion: null as Condicion | null });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  function revisar() {
    const nuevos: Record<string, string> = {};
    if (!datos.nombre.trim()) nuevos.nombre = "Escriba el nombre de quien votará por usted.";
    if (!/^\d{8}$/.test(datos.dni.trim()))
      nuevos.dni = "El DNI tiene 8 cifras. Revíselo y escríbalo de nuevo.";
    if (!datos.condicion) nuevos.condicion = "Elija quién es para usted.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) setPaso("confirmar");
  }

  async function delegar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson(`/api/asambleas/${asambleaId}/delegaciones`, "POST", datos);
    setEnviando(false);
    if (r.ok) return router.refresh();
    if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("redactar");
    } else {
      // El límite de casas por apoderado vuelve al paso 1, donde se elige a otra persona.
      setFalla(r.error);
      setPaso("redactar");
    }
  }

  if (paso === "confirmar" && datos.condicion) {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={`¿Desea dejarle su voto a ${datos.nombre.trim()}?`}
        filas={[
          [
            "A quién",
            `${datos.nombre.trim()} · DNI terminado en ${datos.dni.trim().slice(-2)} · ${EN_TEXTO[datos.condicion]}`,
            () => setPaso("redactar"),
          ],
          ["Hasta cuándo", `Hasta que termine la asamblea del ${asambleaEnPalabras}`],
        ]}
        efecto={`${datos.nombre.trim()} podrá votar en su nombre ese día. Usted puede anular la delegación hasta el ${plazoEnPalabras}.`}
        textoConfirmar="Sí, delegar mi voto"
        textoCancelar="Cancelar, no delegar"
        enviando={enviando}
        error={falla}
        alConfirmar={delegar}
        alCorregir={() => setPaso("redactar")}
        hrefCancelar="/asambleas"
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
      <Link
        href="/asambleas"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a Asambleas
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Delegar mi voto
        </h1>
        <p>Delegar es darle a otra persona el permiso de votar por usted. Titular: {titular}.</p>
      </div>
      <ResumenErrores errores={listaErrores} />
      {falla && (
        <MensajeEstado tipo="aviso" titulo="No se pudo delegar">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Campo
        name="nombre"
        etiqueta="Nombre de quien votará por usted"
        autoComplete="off"
        maxLength={120}
        value={datos.nombre}
        error={errores.nombre}
        onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
      />
      <Campo
        name="dni"
        etiqueta="Su DNI"
        inputMode="numeric"
        autoComplete="off"
        maxLength={8}
        value={datos.dni}
        error={errores.dni}
        onChange={(e) => setDatos({ ...datos, dni: e.target.value })}
      />
      <SelectorEnHoja
        id="campo-condicion"
        pregunta="¿Quién es para usted?"
        vacio="Elegir una opción"
        opciones={CONDICIONES}
        valor={datos.condicion}
        alElegir={(condicion) => setDatos({ ...datos, condicion })}
        error={errores.condicion}
      />
      <div className="flex flex-col gap-1">
        <p className="font-bold">¿Hasta cuándo?</p>
        <p>Solo para la asamblea del {asambleaEnPalabras}. Después, su voto vuelve a ser suyo.</p>
      </div>
      <Boton type="submit" icono={ArrowRight} anchoCompleto>
        Revisar la delegación
      </Boton>
    </form>
  );
}
