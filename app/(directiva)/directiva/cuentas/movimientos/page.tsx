import { ChevronLeft, CircleMinus, CirclePlus, FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { Cifra } from "@/componentes/a11y/Cifra";
import { EncabezadoPagina } from "@/componentes/a11y/EncabezadoPagina";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { SelectorDeFiltro } from "@/componentes/a11y/SelectorDeFiltro";
import { soles } from "@/compartido/dinero";
import { rendicionDeCuentas } from "@/modulos/transparencia/aplicacion/caja";

export const metadata: Metadata = { title: "Ingresos y gastos" };

const RUTA = "/directiva/cuentas/movimientos";
const TIPOS = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "gastos", etiqueta: "Gastos" },
  { valor: "ingresos", etiqueta: "Ingresos" },
];

// DIR-TRA-05 (HU-COB-14): todo lo que entró y salió de la caja de vigilancia en el mes, con su comprobante. Las cuotas se suman
// solas con los recibos emitidos; lo demás lo registra la directiva y no se borra.
export default async function Movimientos({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; tipo?: string }>;
}) {
  const sesion = await exigirActor(["DIRECTIVA", "DIRECTIVO_MEDIADOR"], "/entrar/equipo");
  const pedido = await searchParams;
  const r = await rendicionDeCuentas(sesion, pedido.mes);
  const tipo = TIPOS.find((t) => t.valor === pedido.tipo) ?? TIPOS[0];
  const movimientos = r.movimientos.filter(
    (m) => tipo.valor === "todos" || m.tipo === (tipo.valor === "gastos" ? "GASTO" : "INGRESO"),
  );
  const mostrarCuotas = tipo.valor !== "gastos";
  const filas = [
    ...(mostrarCuotas
      ? [
          {
            id: "cuotas",
            fecha: "Todo el mes",
            autor: "Sistema",
            concepto: "Cuotas de vigilancia (recibos del mes)",
            tipo: "INGRESO",
            nota: "Se suma solo con los recibos emitidos",
            monto: r.ingresosPorCuotas,
            comprobanteId: null as string | null,
          },
        ]
      : []),
    ...movimientos.map((m) => ({ ...m, nota: m.detalle })),
  ];
  const enlace = (mes: string, t: string) => `${RUTA}?mes=${mes}&tipo=${t}`;
  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/directiva/cuentas?mes=${r.mes}`}
        className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace"
      >
        <ChevronLeft aria-hidden className="size-icono" />
        Volver a la rendición
      </Link>
      <EncabezadoPagina
        titulo="Ingresos y gastos"
        descripcion={`${r.etiqueta}. Todo lo que registre aquí entra a la rendición de cuentas.`}
        accion={
          sesion.roles.includes("DIRECTIVA") ? (
            <BotonEnlace href="/directiva/cuentas/registrar" icono={Plus} anchoCompleto>
              Registrar un ingreso o gasto
            </BotonEnlace>
          ) : undefined
        }
      />
      <ul data-ancho="completo" className="grid gap-separacion sm:grid-cols-3">
        {(
          [
            ["Ingresos de la caja", soles(r.ingresos), undefined],
            [
              "Gastos de la caja",
              soles(r.gastos),
              r.comprobantes === 1 ? "1 comprobante adjunto" : `${r.comprobantes} comprobantes adjuntos`,
            ],
            ["Saldo de la caja", soles(r.saldo), undefined],
          ] as [string, string, string | undefined][]
        ).map(([titulo, valor, detalle]) => (
          <li key={titulo} className="flex">
            <Cifra titulo={titulo} valor={valor} detalle={detalle} />
          </li>
        ))}
      </ul>
      {/* El filtro va debajo de las cifras, en su propia fila, y la lista a todo el ancho. */}
      <div data-ancho="completo" className="lg:w-1/2">
        <SelectorDeFiltro
          id="campo-tipo"
          pregunta="Mostrar"
          valor={tipo.valor}
          opciones={TIPOS.map((t) => ({ ...t, href: enlace(r.mes, t.valor) }))}
        />
      </div>
      <div data-ancho="completo" className="flex flex-col gap-separacion">
        <ListaVerMas
          etiqueta="Ingresos y gastos"
          elementos={filas.map((m) => {
            const gasto = m.tipo === "GASTO";
            const Icono = gasto ? CircleMinus : CirclePlus;
            return (
              <article
                key={m.id}
                className="flex items-center gap-4 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
              >
                <Icono
                  aria-hidden
                  className={`size-icono shrink-0 ${gasto ? "text-texto-error" : "text-texto-exito"}`}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-pequeno text-texto-secundario">
                    {m.fecha} · {m.autor}
                  </p>
                  <h2 className="text-titulo-3">{m.concepto}</h2>
                  <p>{gasto ? "Gasto" : "Ingreso"} · Caja de vigilancia</p>
                  {m.nota && <p className="text-pequeno text-texto-secundario">{m.nota}</p>}
                  {m.comprobanteId && (
                    <Link
                      href={`/api/archivos/${m.comprobanteId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace underline underline-offset-4"
                    >
                      <FileText aria-hidden className="size-icono shrink-0" />
                      Ver el comprobante
                      <span className="sr-only"> de {m.concepto}</span>
                    </Link>
                  )}
                </div>
                <strong className="shrink-0 text-titulo-3">
                  {gasto ? "− " : "+ "}
                  {soles(m.monto)}
                </strong>
              </article>
            );
          })}
        />
      </div>
    </div>
  );
}
