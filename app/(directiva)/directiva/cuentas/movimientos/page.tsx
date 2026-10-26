import { ChevronLeft, FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { exigirActor } from "@/app/_sesion/sesion";
import { BotonEnlace } from "@/componentes/a11y/Boton";
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
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Ingresos y gastos</h1>
        <p>{r.etiqueta}. Todo lo que registre aquí entra a la rendición de cuentas.</p>
      </div>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Ingresos de la caja", soles(r.ingresos), null],
          [
            "Gastos de la caja",
            soles(r.gastos),
            r.comprobantes === 1 ? "1 comprobante adjunto" : `${r.comprobantes} comprobantes adjuntos`,
          ],
          ["Saldo de la caja", soles(r.saldo), null],
        ].map(([titulo, valor, detalle]) => (
          <div
            key={titulo}
            className="flex flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
          >
            <dt className="text-pequeno text-texto-secundario">{titulo}</dt>
            <dd className="text-titulo-2 font-bold">{valor}</dd>
            {detalle && <dd className="text-pequeno text-texto-secundario">{detalle}</dd>}
          </div>
        ))}
      </dl>
      <SelectorDeFiltro
        id="campo-tipo"
        pregunta="Mostrar"
        valor={tipo.valor}
        opciones={TIPOS.map((t) => ({ ...t, href: enlace(r.mes, t.valor) }))}
      />
      <ListaVerMas
        etiqueta="Ingresos y gastos"
        elementos={filas.map((m) => (
          <article
            key={m.id}
            className="flex flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6"
          >
            <p className="text-pequeno text-texto-secundario">
              {m.fecha} · {m.autor}
            </p>
            <h2 className="text-titulo-3">{m.concepto}</h2>
            <p>{m.tipo === "GASTO" ? "Gasto" : "Ingreso"} · Caja de vigilancia</p>
            {m.nota && <p className="text-texto-secundario">{m.nota}</p>}
            <p className="text-titulo-3">
              {m.tipo === "GASTO" ? "− " : "+ "}
              {soles(m.monto)}
            </p>
            {m.comprobanteId && (
              <Link
                href={`/api/archivos/${m.comprobanteId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-tactil items-center gap-2 self-start font-bold text-texto-enlace underline underline-offset-4"
              >
                <FileText aria-hidden className="size-icono" />
                Ver el comprobante
              </Link>
            )}
          </article>
        ))}
      />
      {sesion.roles.includes("DIRECTIVA") && (
        <BotonEnlace href="/directiva/cuentas/registrar" variante="secundario" icono={Plus}>
          Registrar un ingreso o gasto
        </BotonEnlace>
      )}
    </div>
  );
}
