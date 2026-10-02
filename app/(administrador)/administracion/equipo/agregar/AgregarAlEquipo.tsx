"use client";
// @HU-GAR-21

import { ArrowRight, ChevronLeft, CircleCheck, CircleX, Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { enviarJson } from "@/app/_formularios/enviar";
import { fechaYHora } from "@/compartido/fechas";
import { Boton, BotonEnlace } from "@/componentes/a11y/Boton";
import { Campo } from "@/componentes/a11y/Campo";
import { MensajeEstado } from "@/componentes/a11y/MensajeEstado";
import { GrupoOpciones, Opcion } from "@/componentes/a11y/Opcion";
import { PasoConfirmacion } from "@/componentes/a11y/PasoConfirmacion";
import { ResumenErrores } from "@/componentes/a11y/ResumenErrores";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";
import type { agregarAlEquipo, buscarEnPadron, RolEquipo } from "@/modulos/identidad/aplicacion/equipo";

// Agregar a una persona al equipo (prototipo ADM-EQU-02 a 04): del padrón, sin volver a escribir sus
// datos (WCAG 3.3.7), o de afuera; el rol con lo que podrá y no podrá hacer; confirmación y resultado.

type Encontrada = Awaited<ReturnType<typeof buscarEnPadron>>;
type Agregado = Awaited<ReturnType<typeof agregarAlEquipo>>;
type Errores = Record<string, string>;

export function AgregarAlEquipo({
  roles,
}: {
  roles: { rol: RolEquipo; nombre: string; puede: string[]; noPuede: string[] }[];
}) {
  const [paso, setPaso] = useState<"datos" | "confirmar" | "listo">("datos");
  const [vive, setVive] = useState<"padron" | "afuera">("padron");
  const [dniBuscado, setDniBuscado] = useState("");
  const [encontrada, setEncontrada] = useState<Encontrada | null>(null);
  const [afuera, setAfuera] = useState({ nombreCompleto: "", dni: "", telefono: "" });
  const [rol, setRol] = useState<RolEquipo>("DIRECTIVA");
  const [errores, setErrores] = useState<Errores>({});
  const [falla, setFalla] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [agregado, setAgregado] = useState<Agregado | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    titulo.current?.focus();
  }, [paso]);

  const elegido = roles.find((r) => r.rol === rol) ?? roles[0];
  const nombre = vive === "padron" ? (encontrada?.nombre ?? "") : afuera.nombreCompleto.trim();

  async function buscar() {
    setEnviando(true);
    setEncontrada(null);
    const r = await enviarJson<Encontrada>("/api/admin/cuentas/buscar", "POST", { dni: dniBuscado });
    setEnviando(false);
    if (r.ok) {
      setErrores({});
      setEncontrada(r.datos);
    } else setErrores({ buscar: r.campos.dni ?? r.error });
  }

  function revisar() {
    const nuevos: Errores = {};
    if (vive === "padron" && !encontrada) nuevos.buscar = "Busque a la persona en el padrón con su DNI.";
    if (vive === "afuera") {
      if (!afuera.nombreCompleto.trim())
        nuevos["persona.nombreCompleto"] = "Falta el nombre. Escríbalo como figura en su DNI.";
      if (!/^\d{8}$/.test(afuera.dni))
        nuevos["persona.dni"] = "El DNI tiene 8 números. Revise que estén todos.";
      if (!/^9\d{8}$/.test(afuera.telefono.replace(/\D/g, "")))
        nuevos["persona.telefono"] = "El WhatsApp tiene 9 números y empieza con 9. Revíselo.";
    }
    setErrores(nuevos);
    if (!Object.keys(nuevos).length) setPaso("confirmar");
  }

  async function confirmar() {
    setEnviando(true);
    setFalla(null);
    const persona =
      vive === "padron"
        ? { tipo: "padron", usuarioId: encontrada?.usuarioId }
        : { tipo: "afuera", ...afuera };
    const r = await enviarJson<Agregado>("/api/admin/cuentas", "POST", { persona, rol });
    setEnviando(false);
    if (r.ok) {
      setAgregado(r.datos);
      setPaso("listo");
    } else if (r.estado === 400) {
      setErrores(r.campos);
      setPaso("datos");
    } else setFalla(r.error);
  }

  if (paso === "listo" && agregado) {
    return (
      <div className="flex flex-col gap-6">
        <MensajeEstado tipo="exito" titulo={`Invitación enviada a ${agregado.nombre}`}>
          <p>Le llegó por WhatsApp para crear su acceso de equipo.</p>
        </MensajeEstado>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          {agregado.nombre} ya es parte del equipo
        </h1>
        <dl className="flex flex-col gap-3 rounded-control bg-fondo-suave p-4 senior:p-6">
          {[
            ["Rol", agregado.rolTexto],
            ["Cómo entra", "Con su DNI y su clave de equipo, distinta del enlace de vecinos"],
            [
              "Invitación",
              `Por WhatsApp al ${agregado.whatsapp}; vence el ${fechaYHora(new Date(agregado.invitacionVence))}`,
            ],
            ["Registrado por", `${agregado.registradoPor}, ${fechaYHora(new Date(agregado.registradoEn))}`],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex flex-col">
              <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
              <dd className="font-bold">{valor}</dd>
            </div>
          ))}
        </dl>
        {encontrada && <p>Su cuenta de vecino en {encontrada.vivienda} no cambia.</p>}
        <BotonEnlace href="/administracion/equipo" icono={Users}>
          Volver a cuentas del equipo
        </BotonEnlace>
      </div>
    );
  }

  if (paso === "confirmar") {
    return (
      <PasoConfirmacion
        referencia={titulo}
        titulo={`¿Desea dar acceso de equipo a ${nombre}?`}
        filas={[
          ["Persona", nombre],
          ["Rol", elegido.nombre],
          [
            "WhatsApp",
            (vive === "padron" ? encontrada?.whatsapp : afuera.telefono) ?? "Sin WhatsApp registrado",
          ],
          [
            "Datos",
            vive === "padron"
              ? `Tomados del padrón (${encontrada?.vivienda})`
              : "Escritos ahora: no vive en el barrio",
          ],
        ]}
        efecto="Le enviaremos por WhatsApp una invitación para crear su acceso de equipo. Es distinto del enlace de vecinos y vence en 48 horas."
        textoConfirmar="Sí, dar acceso"
        enviando={enviando}
        error={falla}
        alConfirmar={confirmar}
        alCorregir={() => setPaso("datos")}
        hrefCancelar="/administracion/equipo"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/administracion/equipo"
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a cuentas del equipo
      </Link>
      <div className="flex flex-col gap-2">
        <p className="text-texto-secundario">Paso 1 de 2</p>
        <h1 ref={titulo} tabIndex={-1} className="text-titulo-1">
          Agregar a una persona al equipo
        </h1>
      </div>
      <ResumenErrores
        errores={Object.entries(errores).map(([campo, mensaje]) => ({ campo: `campo-${campo}`, mensaje }))}
      />

      <GrupoOpciones id="campo-vive" pregunta="¿Vive en el barrio?">
        <Opcion
          tipo="radio"
          name="vive"
          etiqueta="Sí, ya está en el padrón: sus datos se toman de ahí"
          checked={vive === "padron"}
          onChange={() => {
            setVive("padron");
            setErrores({});
          }}
        />
        <Opcion
          tipo="radio"
          name="vive"
          etiqueta="No, es de afuera: por ejemplo, un vigilante contratado"
          checked={vive === "afuera"}
          onChange={() => {
            setVive("afuera");
            setErrores({});
          }}
        />
      </GrupoOpciones>

      {vive === "padron" ? (
        <div className="flex flex-col gap-4">
          <Campo
            id="campo-buscar"
            name="buscar"
            etiqueta="Su DNI, para buscarla en el padrón"
            inputMode="numeric"
            maxLength={8}
            autoComplete="off"
            value={dniBuscado}
            error={errores.buscar}
            onChange={(e) => setDniBuscado(e.target.value.replace(/\D/g, "").slice(0, 8))}
          />
          <Boton
            variante="secundario"
            icono={Search}
            className="self-start"
            cargando={enviando}
            onClick={buscar}
          >
            Buscar en el padrón
          </Boton>
          {encontrada && (
            <Tarjeta titulo={encontrada.nombre}>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["Vivienda", encontrada.vivienda],
                  ["DNI", `Terminado en ${encontrada.dniTerminadoEn}`],
                  ["WhatsApp", encontrada.whatsapp ?? "Sin WhatsApp registrado"],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="flex flex-col">
                    <dt className="text-pequeno text-texto-secundario">{etiqueta}</dt>
                    <dd className="font-bold">{valor}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-texto-secundario">
                Ya tenemos estos datos del padrón. No hace falta escribirlos de nuevo.
              </p>
            </Tarjeta>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Campo
            name="persona.nombreCompleto"
            etiqueta="Nombres y apellidos"
            autoComplete="off"
            value={afuera.nombreCompleto}
            error={errores["persona.nombreCompleto"]}
            onChange={(e) => setAfuera({ ...afuera, nombreCompleto: e.target.value })}
          />
          <Campo
            name="persona.dni"
            etiqueta="DNI"
            inputMode="numeric"
            maxLength={8}
            autoComplete="off"
            value={afuera.dni}
            error={errores["persona.dni"]}
            onChange={(e) => setAfuera({ ...afuera, dni: e.target.value.replace(/\D/g, "").slice(0, 8) })}
          />
          <Campo
            name="persona.telefono"
            etiqueta="WhatsApp"
            ayuda="Aquí le llegará la invitación. Son 9 números."
            inputMode="tel"
            autoComplete="off"
            value={afuera.telefono}
            error={errores["persona.telefono"]}
            onChange={(e) => setAfuera({ ...afuera, telefono: e.target.value })}
          />
        </div>
      )}

      <GrupoOpciones id="campo-rol" pregunta="¿Qué rol tendrá?" error={errores.rol}>
        {roles.map((r) => (
          <Opcion
            key={r.rol}
            tipo="radio"
            name="rol"
            etiqueta={r.nombre}
            checked={rol === r.rol}
            onChange={() => setRol(r.rol)}
          />
        ))}
      </GrupoOpciones>

      <section
        aria-labelledby="titulo-permisos"
        className="flex flex-col gap-3 rounded-control bg-fondo-suave p-4 senior:p-6"
      >
        <h2 id="titulo-permisos" className="text-titulo-3">
          Podrá hacer
        </h2>
        <ul className="flex flex-col gap-2">
          {elegido.puede.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <CircleCheck aria-hidden className="size-icono shrink-0 text-texto-exito" />
              {p}
            </li>
          ))}
        </ul>
        {elegido.noPuede.length > 0 && (
          <>
            <h3 className="font-bold">No podrá</h3>
            <ul className="flex flex-col gap-2">
              {elegido.noPuede.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <CircleX aria-hidden className="size-icono shrink-0 text-texto-secundario" />
                  {p}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <Boton icono={ArrowRight} anchoCompleto onClick={revisar}>
        Revisar
      </Boton>
    </div>
  );
}
