"use client";
// @HU-GAR-01

import { ArrowRight, Check, ChevronLeft, List, Smartphone, User, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { fechaYHora, primerNombre } from "@/compartido/fechas";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo, MensajeDeCampo } from "@/componentes/a11y/Campo";
import { Contador } from "@/componentes/a11y/Contador";
import { Interruptor } from "@/componentes/a11y/Interruptor";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import type { ViviendaEmpadronada } from "@/modulos/identidad/aplicacion/empadronar";

// Asistente de empadronamiento (prototipo ADM-PAD-03 a 07). Cada paso se revisa en el servidor
// antes de avanzar: lote libre y DNI que no estén en el padrón (HU-GAR-01 CA1 y CA3). Lo escrito
// nunca se borra al volver o al fallar (WCAG 3.3.7).

type Uso = "VIVIENDA" | "NEGOCIO" | "VIVIENDA_Y_NEGOCIO";
type Relacion = "CONYUGE" | "HIJO" | "PADRE" | "OTRO";

const USOS: [Uso, string][] = [
  ["VIVIENDA", "Vivienda"],
  ["NEGOCIO", "Negocio"],
  ["VIVIENDA_Y_NEGOCIO", "Vivienda y negocio"],
];
const RELACIONES: [Relacion, string][] = [
  ["CONYUGE", "Esposo o esposa"],
  ["HIJO", "Hijo o hija"],
  ["PADRE", "Padre o madre"],
  ["OTRO", "Otro familiar o inquilino"],
];
const CONCEPTOS = [
  ["familias", "Familias"],
  ["inquilinos", "Inquilinos"],
  ["autos", "Autos o camionetas"],
  ["motos", "Motos"],
  ["triciclos", "Triciclos o carretas"],
  ["negocios", "Locales de negocio"],
] as const;
type Concepto = (typeof CONCEPTOS)[number][0];

type Vivienda = { manzana: string; lote: string; uso: Uso } & Record<Concepto, number>;
type Titular = { nombreCompleto: string; dni: string; dniVisto: boolean; telefono: string };
type Otro = Titular & { relacion: Relacion; cuentaPropia: boolean };
type Paso = "vivienda" | "residentes" | "confirmar" | "listo";
type Errores = Record<string, string>;

const VIVIENDA: Vivienda = {
  manzana: "",
  lote: "",
  uso: "VIVIENDA",
  familias: 1,
  inquilinos: 0,
  autos: 0,
  motos: 0,
  triciclos: 0,
  negocios: 0,
};
const TITULAR: Titular = { nombreCompleto: "", dni: "", dniVisto: false, telefono: "" };
const OTRO: Otro = { ...TITULAR, relacion: "HIJO", cuentaPropia: true };

const soloNumeros = (texto: string, maximo: number) => texto.replace(/\D/g, "").slice(0, maximo);
const telefonoLegible = (telefono: string) => telefono.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3");
const direccion = (v: Vivienda) =>
  `Mz. ${v.manzana.trim().toUpperCase() || "—"}, lote ${v.lote.trim() || "—"}`;
const nombreRelacion = (r: Relacion) => RELACIONES.find(([clave]) => clave === r)?.[1] ?? "";

/** Errores cuyo campo empieza con el prefijo, sin el prefijo: "otros.2.dni" → "dni". */
function erroresDe(errores: Errores, prefijo: string): Errores {
  return Object.fromEntries(
    Object.entries(errores)
      .filter(([campo]) => campo.startsWith(`${prefijo}.`))
      .map(([campo, mensaje]) => [campo.slice(prefijo.length + 1), mensaje]),
  );
}

export function AsistenteEmpadronar() {
  const [paso, setPaso] = useState<Paso>("vivienda");
  const [vivienda, setVivienda] = useState(VIVIENDA);
  const [titular, setTitular] = useState(TITULAR);
  const [otros, setOtros] = useState<Otro[]>([]);
  const [nuevo, setNuevo] = useState<Otro | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ViviendaEmpadronada | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  // Al cambiar de paso, el foco va al título: el lector de pantalla anuncia dónde está.
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
    window.scrollTo({ top: 0 });
  }, [paso]);

  const cuerpo = (extra: { titular?: Titular; otros?: Otro[] } = {}) => ({ vivienda, ...extra });

  /** Revisa en el servidor sin guardar: los errores por campo, vacío si está bien, o null si no hubo respuesta. */
  async function revisar(datos: object): Promise<Errores | null> {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<null>("/api/admin/padron/validar", "POST", datos);
    setEnviando(false);
    if (r.ok) return {};
    if (r.estado === 400) return r.campos;
    setFalla(r.error);
    return null;
  }

  async function siguienteVivienda() {
    const e = await revisar(cuerpo());
    if (!e) return;
    setErrores(e);
    if (!Object.keys(e).length) setPaso("residentes");
  }

  async function revisarTodo() {
    const e = await revisar(cuerpo({ titular, otros }));
    if (!e) return;
    setErrores(e);
    if (Object.keys(e).some((c) => c.startsWith("vivienda."))) setPaso("vivienda");
    else if (!Object.keys(e).length) setPaso("confirmar");
  }

  /** La persona nueva se revisa sola al agregarla; sus errores van a su formulario. */
  async function guardarOtro() {
    if (!nuevo) return;
    const prefijo = `otros.${otros.length}.`;
    // Con el titular ya escrito, también se revisa que no repita su DNI ni su WhatsApp.
    const conTitular = /^\d{8}$/.test(titular.dni) && titular.nombreCompleto.trim() !== "";
    const e = await revisar(cuerpo({ titular: conTitular ? titular : undefined, otros: [...otros, nuevo] }));
    if (!e) return;
    const propios = Object.fromEntries(Object.entries(e).filter(([c]) => c.startsWith(prefijo)));
    setErrores(propios);
    if (Object.keys(propios).length) return;
    setOtros([...otros, nuevo]);
    setNuevo(null);
  }

  async function empadronar() {
    setEnviando(true);
    setFalla(null);
    const r = await enviarJson<ViviendaEmpadronada>(
      "/api/admin/padron/empadronar",
      "POST",
      cuerpo({ titular, otros }),
    );
    setEnviando(false);
    if (r.ok) {
      setResultado(r.datos);
      setPaso("listo");
    } else if (r.estado === 400) {
      setErrores(r.campos);
      setPaso(Object.keys(r.campos).some((c) => c.startsWith("vivienda.")) ? "vivienda" : "residentes");
    } else setFalla(r.error);
  }

  const listaErrores = Object.entries(errores).map(([campo, mensaje]) => ({
    campo: `campo-${nuevo ? campo.replace(`otros.${otros.length}.`, "nuevo.") : campo}`,
    mensaje,
  }));
  const conCuenta = otros.filter((o) => o.cuentaPropia);

  if (paso === "listo" && resultado) {
    const [titularEnviado, ...otrosEnviados] = resultado.enlacesEnviados;
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo="Vivienda empadronada">
          <p>
            Registrado por {resultado.registradoPor} el {fechaYHora(new Date(resultado.registradoEn))}
          </p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {resultado.direccion} ya está en el padrón
        </h1>
        <p>
          Enviamos su enlace de entrada por WhatsApp a {primerNombre(titularEnviado.nombre)} (
          {telefonoLegible(titularEnviado.telefono)}). Sirve una sola vez y vence en 15 minutos.
        </p>
        {otrosEnviados.length > 0 && (
          <Tarjeta titulo="También enviamos su enlace a">
            <ul className="flex flex-col gap-3">
              {otrosEnviados.map((o) => (
                <li key={o.telefono} className="flex flex-col">
                  <strong>{o.nombre}</strong>
                  <span>
                    WhatsApp {telefonoLegible(o.telefono)} · {o.relacion}
                  </span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        )}
        <div className="flex flex-col gap-separacion md:flex-row">
          <BotonEnlace href="/administracion/padron" icono={List}>
            Volver al padrón
          </BotonEnlace>
          <BotonEnlace href={`/administracion/padron/${resultado.predioId}`} variante="secundario">
            Ver la ficha de la vivienda
          </BotonEnlace>
        </div>
      </div>
    );
  }

  if (paso === "confirmar") {
    const filas: [string, string][] = [
      ["Vivienda", direccion(vivienda)],
      ["Uso", USOS.find(([u]) => u === vivienda.uso)?.[1] ?? ""],
      ["Titular", `${titular.nombreCompleto.trim()} · DNI ${titular.dni}`],
      [
        "Otras personas",
        otros
          .map(
            (o) =>
              `${o.nombreCompleto.trim()} (${nombreRelacion(o.relacion).toLowerCase()}, ${o.cuentaPropia ? "con cuenta" : "sin cuenta"})`,
          )
          .join("; ") || "Ninguna",
      ],
      [
        "Ocupación",
        CONCEPTOS.filter(([c]) => vivienda[c] > 0)
          .map(([c, nombre]) => `${nombre}: ${vivienda[c]}`)
          .join(" · ") || "Ninguna",
      ],
      [
        "Enlaces de entrada",
        [titular, ...conCuenta]
          .map((p) => `${primerNombre(p.nombreCompleto)}: ${telefonoLegible(soloNumeros(p.telefono, 9))}`)
          .join(" · "),
      ],
    ];
    return (
      <PasoConfirmacion
        referencia={titulo}
        paso="Paso 3 de 3"
        titulo={`¿Desea empadronar ${direccion(vivienda)}?`}
        filas={filas}
        efecto={`Quedará en el padrón y le enviaremos su enlace de entrada por WhatsApp a ${primerNombre(titular.nombreCompleto)}${conCuenta.length > 0 ? " y a las otras personas con cuenta propia" : ""}.`}
        textoConfirmar="Sí, empadronar"
        enviando={enviando}
        error={falla}
        alConfirmar={empadronar}
        alCorregir={() => setPaso("residentes")}
        hrefCancelar="/administracion/padron"
      />
    );
  }

  if (paso === "residentes") {
    const dir = direccion(vivienda);
    const eTitular = erroresDe(errores, "titular");
    const eNuevo = erroresDe(errores, `otros.${otros.length}`);
    return (
      <div className="flex flex-col gap-6">
        <Volver alPulsar={() => setPaso("vivienda")}>Volver a la vivienda</Volver>
        <Titulo
          referencia={titulo}
          paso="Paso 2 de 3"
          ayuda="La dirección ya la tenemos del paso 1: no hace falta escribirla de nuevo."
        >
          ¿Quién vive en {dir}?
        </Titulo>
        <ResumenErrores errores={listaErrores} />

        <section aria-labelledby="titulo-titular" className="flex flex-col gap-6">
          <h2 id="titulo-titular" className="flex items-center gap-2 text-titulo-2">
            <User aria-hidden className="size-icono" />
            Titular
          </h2>
          <CasillaDni
            id="campo-titular.dniVisto"
            etiqueta="Vi el DNI físico y los datos coinciden"
            marcada={titular.dniVisto}
            error={eTitular.dniVisto}
            alCambiar={(dniVisto) => setTitular({ ...titular, dniVisto })}
          />
          <Campo
            name="titular.dni"
            etiqueta="DNI"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            value={titular.dni}
            error={eTitular.dni}
            onChange={(e) => setTitular({ ...titular, dni: soloNumeros(e.target.value, 8) })}
          />
          <Campo
            name="titular.nombreCompleto"
            etiqueta="Nombres y apellidos"
            autoComplete="off"
            value={titular.nombreCompleto}
            error={eTitular.nombreCompleto}
            onChange={(e) => setTitular({ ...titular, nombreCompleto: e.target.value })}
          />
          <Campo
            name="titular.telefono"
            etiqueta="WhatsApp"
            ayuda="A este número le enviaremos su enlace de entrada. Son 9 números."
            inputMode="tel"
            autoComplete="off"
            value={titular.telefono}
            error={eTitular.telefono}
            onChange={(e) => setTitular({ ...titular, telefono: e.target.value })}
          />
        </section>

        <section aria-labelledby="titulo-otros" className="flex flex-col gap-4">
          <h2 id="titulo-otros" className="flex items-center gap-2 text-titulo-2">
            <Users aria-hidden className="size-icono" />
            Otras personas que viven ahí (opcional)
          </h2>
          {otros.map((o, i) => {
            const eOtro = erroresDe(errores, `otros.${i}`);
            return (
              <Tarjeta key={o.dni} titulo={o.nombreCompleto.trim()} nivel={3}>
                <p>
                  {nombreRelacion(o.relacion)} · DNI terminado en {o.dni.slice(-2)} · verificado en físico
                </p>
                <p>
                  {o.cuentaPropia
                    ? `Con cuenta propia: su enlace irá al WhatsApp ${telefonoLegible(soloNumeros(o.telefono, 9))}`
                    : "Sin cuenta propia: los avisos de la casa le llegan a la persona titular"}
                </p>
                {Object.entries(eOtro).map(([campo, mensaje]) => (
                  <MensajeDeCampo key={campo} id={`campo-otros.${i}.${campo}`}>
                    {mensaje}
                  </MensajeDeCampo>
                ))}
                <Boton
                  variante="secundario"
                  className="self-start"
                  onClick={() => {
                    setOtros(otros.filter((_, j) => j !== i));
                    setErrores({});
                  }}
                >
                  Quitar a {primerNombre(o.nombreCompleto)}
                </Boton>
              </Tarjeta>
            );
          })}

          {nuevo ? (
            <FormularioOtro
              dir={dir}
              persona={nuevo}
              errores={eNuevo}
              enviando={enviando}
              alCambiar={setNuevo}
              alGuardar={guardarOtro}
              alCancelar={() => {
                setNuevo(null);
                setErrores({});
              }}
            />
          ) : (
            <Boton
              variante="secundario"
              icono={UserPlus}
              className="self-start"
              onClick={() => setNuevo(OTRO)}
            >
              Agregar otra persona
            </Boton>
          )}
        </section>

        {falla && (
          <MensajeEstado tipo="error" titulo="No pudimos revisar los datos">
            <p>{falla}</p>
          </MensajeEstado>
        )}
        {!nuevo && (
          <Boton icono={ArrowRight} anchoCompleto cargando={enviando} onClick={revisarTodo}>
            Revisar todo
          </Boton>
        )}
      </div>
    );
  }

  const eVivienda = erroresDe(errores, "vivienda");
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/administracion/padron"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver al padrón
      </Link>
      <Titulo
        referencia={titulo}
        paso="Paso 1 de 3"
        ayuda="Primero la vivienda. En el paso 2, las personas que viven ahí."
      >
        Empadronar una vivienda
      </Titulo>
      <ResumenErrores errores={listaErrores} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          name="vivienda.manzana"
          etiqueta="Manzana"
          ayuda="Una letra, por ejemplo C."
          autoComplete="off"
          maxLength={3}
          value={vivienda.manzana}
          error={eVivienda.manzana}
          onChange={(e) => setVivienda({ ...vivienda, manzana: e.target.value })}
        />
        <Campo
          name="vivienda.lote"
          etiqueta="Lote"
          inputMode="numeric"
          autoComplete="off"
          maxLength={5}
          value={vivienda.lote}
          error={eVivienda.lote}
          onChange={(e) => setVivienda({ ...vivienda, lote: e.target.value })}
        />
      </div>
      <GrupoOpciones id="campo-vivienda.uso" pregunta="¿Para qué se usa?" error={eVivienda.uso}>
        {USOS.map(([uso, etiqueta]) => (
          <Opcion
            key={uso}
            tipo="radio"
            name="uso"
            etiqueta={etiqueta}
            checked={vivienda.uso === uso}
            onChange={() => setVivienda({ ...vivienda, uso })}
          />
        ))}
      </GrupoOpciones>
      <section aria-labelledby="titulo-ocupacion" className="flex flex-col gap-2">
        <h2 id="titulo-ocupacion" className="text-titulo-3">
          ¿Cuántos hay de cada uno?
        </h2>
        <p className="text-texto-secundario">
          Es la misma lista de conceptos de la tarifa que aprobó la directiva.
        </p>
        <div className="flex flex-col">
          {CONCEPTOS.map(([concepto, etiqueta]) => (
            <Contador
              key={concepto}
              id={`campo-vivienda.${concepto}`}
              etiqueta={etiqueta}
              valor={vivienda[concepto]}
              minimo={concepto === "familias" && vivienda.uso !== "NEGOCIO" ? 1 : 0}
              maximo={9}
              error={eVivienda[concepto]}
              alCambiar={(valor) => setVivienda({ ...vivienda, [concepto]: valor })}
            />
          ))}
        </div>
      </section>
      {falla && (
        <MensajeEstado tipo="error" titulo="No pudimos revisar los datos">
          <p>{falla}</p>
        </MensajeEstado>
      )}
      <Boton icono={ArrowRight} anchoCompleto cargando={enviando} onClick={siguienteVivienda}>
        Siguiente: las personas
      </Boton>
    </div>
  );
}

function Titulo({
  referencia,
  paso,
  ayuda,
  children,
}: {
  referencia: RefObject<HTMLHeadingElement | null>;
  paso: string;
  ayuda?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-texto-secundario">{paso}</p>
      <h1 ref={referencia} tabIndex={-1} className="text-titulo-1">
        {children}
      </h1>
      {ayuda && <p>{ayuda}</p>}
    </div>
  );
}

function Volver({ alPulsar, children }: { alPulsar: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={alPulsar}
      className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace underline underline-offset-4 cursor-pointer"
    >
      <ChevronLeft aria-hidden className="size-icono" />
      {children}
    </button>
  );
}

function CasillaDni({
  id,
  etiqueta,
  marcada,
  error,
  alCambiar,
}: {
  id: string;
  etiqueta: string;
  marcada: boolean;
  error?: string;
  alCambiar: (marcada: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Opcion
        tipo="checkbox"
        id={id}
        etiqueta={etiqueta}
        checked={marcada}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => alCambiar(e.target.checked)}
      />
      {error && <MensajeDeCampo id={`${id}-error`}>{error}</MensajeDeCampo>}
    </div>
  );
}

function FormularioOtro({
  dir,
  persona,
  errores,
  enviando,
  alCambiar,
  alGuardar,
  alCancelar,
}: {
  dir: string;
  persona: Otro;
  errores: Errores;
  enviando: boolean;
  alCambiar: (persona: Otro) => void;
  alGuardar: () => void;
  alCancelar: () => void;
}) {
  const cambiar = (cambios: Partial<Otro>) => alCambiar({ ...persona, ...cambios });
  return (
    <section
      aria-labelledby="titulo-nuevo"
      className="flex flex-col gap-6 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta"
    >
      <h3 id="titulo-nuevo" className="text-titulo-3">
        Otra persona que vive en {dir}
      </h3>
      <Campo
        id="campo-nuevo.nombreCompleto"
        name="nuevo.nombreCompleto"
        etiqueta="Nombres y apellidos"
        autoComplete="off"
        value={persona.nombreCompleto}
        error={errores.nombreCompleto}
        onChange={(e) => cambiar({ nombreCompleto: e.target.value })}
      />
      <GrupoOpciones
        id="campo-nuevo.relacion"
        pregunta="¿Qué es de la persona titular?"
        error={errores.relacion}
      >
        {RELACIONES.map(([relacion, etiqueta]) => (
          <Opcion
            key={relacion}
            tipo="radio"
            name="relacion"
            etiqueta={etiqueta}
            checked={persona.relacion === relacion}
            onChange={() => cambiar({ relacion })}
          />
        ))}
      </GrupoOpciones>
      <CasillaDni
        id="campo-nuevo.dniVisto"
        etiqueta="Vi su DNI físico y los datos coinciden"
        marcada={persona.dniVisto}
        error={errores.dniVisto}
        alCambiar={(dniVisto) => cambiar({ dniVisto })}
      />
      <Campo
        id="campo-nuevo.dni"
        name="nuevo.dni"
        etiqueta="DNI"
        inputMode="numeric"
        autoComplete="off"
        maxLength={8}
        value={persona.dni}
        error={errores.dni}
        onChange={(e) => cambiar({ dni: soloNumeros(e.target.value, 8) })}
      />
      <Interruptor
        etiqueta="Tendrá su propia cuenta"
        descripcion="Le enviaremos su enlace de entrada por WhatsApp. Verá los avisos de la casa."
        activo={persona.cuentaPropia}
        alCambiar={(cuentaPropia) => cambiar({ cuentaPropia })}
        icono={<Smartphone aria-hidden className="size-icono shrink-0" />}
      />
      {persona.cuentaPropia ? (
        <Campo
          id="campo-nuevo.telefono"
          name="nuevo.telefono"
          etiqueta="Su WhatsApp"
          ayuda="Aquí le llegará su enlace de entrada. Debe ser distinto al de la persona titular."
          inputMode="tel"
          autoComplete="off"
          value={persona.telefono}
          error={errores.telefono}
          onChange={(e) => cambiar({ telefono: e.target.value })}
        />
      ) : (
        <p>
          Sin cuenta propia: los avisos de la casa le llegan a la persona titular. Puede darle una cuenta
          después.
        </p>
      )}
      <div className="flex flex-col gap-separacion md:flex-row">
        <Boton icono={Check} cargando={enviando} onClick={alGuardar}>
          Agregar a esta persona
        </Boton>
        <Boton variante="secundario" onClick={alCancelar}>
          Cancelar
        </Boton>
      </div>
    </section>
  );
}
