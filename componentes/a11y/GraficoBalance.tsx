import { soles } from "@/compartido/dinero";

// Gráfico de un balance (HU-ASA-10 CA2): ingresos, gastos y utilidad neta. Siempre con su tabla
// equivalente y con el monto escrito: nunca depende del color ni de la forma (WCAG 1.4.1, 1.1.1).

type Totales = { ingresos: number; egresos: number; utilidadNeta: number };

export function GraficoBalance({
  totales,
  titulo = "Ingresos, gastos y utilidad neta",
}: {
  totales: Totales;
  titulo?: string;
}) {
  const filas = [
    { clave: "ingresos", etiqueta: "Ingresos", valor: totales.ingresos, color: "bg-accion-primaria" },
    { clave: "egresos", etiqueta: "Gastos", valor: totales.egresos, color: "bg-texto-aviso" },
    {
      clave: "utilidad",
      etiqueta: totales.utilidadNeta < 0 ? "Pérdida" : "Utilidad neta",
      valor: totales.utilidadNeta,
      color: totales.utilidadNeta < 0 ? "bg-texto-error" : "bg-texto-exito",
    },
  ];
  const maximo = Math.max(...filas.map((f) => Math.abs(f.valor)), 1);
  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="text-titulo-3">{titulo}</figcaption>
      <div className="flex flex-col gap-3" aria-hidden>
        {filas.map((f) => (
          <div key={f.clave} className="flex flex-col gap-1">
            <div className="flex justify-between gap-2 font-bold">
              <span>{f.etiqueta}</span>
              <span>{soles(f.valor)}</span>
            </div>
            <div className="h-4 w-full rounded-pastilla bg-fondo-suave">
              <div
                className={`h-4 rounded-pastilla ${f.color}`}
                style={{
                  width: `${Math.max(Math.round((Math.abs(f.valor) / maximo) * 100), f.valor === 0 ? 0 : 2)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{titulo}, en soles</caption>
        <thead>
          <tr>
            <th scope="col" className="border-b border-borde-sutil py-2 pr-2">
              Concepto
            </th>
            <th scope="col" className="border-b border-borde-sutil py-2 text-right">
              Monto
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.clave}>
              <th scope="row" className="border-b border-borde-sutil py-2 pr-2 font-bold">
                {f.etiqueta}
              </th>
              <td className="border-b border-borde-sutil py-2 text-right">{soles(f.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
