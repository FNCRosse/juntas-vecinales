import { soles } from "@/compartido/dinero";

// Gráfico de en qué se gastó (HU-COB-14, DIR-TRA-01 y VEC-TRA-01): una barra horizontal por concepto, del mayor al menor, con el
// monto escrito y su tabla equivalente. Nunca depende del color ni de la forma (WCAG 1.4.1, 1.1.1).

type Fila = { concepto: string; monto: number };

export function GraficoGastos({ gastos, titulo = "En qué se gastó" }: { gastos: Fila[]; titulo?: string }) {
  const maximo = Math.max(...gastos.map((g) => g.monto), 1);
  const total = gastos.reduce((suma, g) => suma + g.monto, 0);
  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="text-titulo-3">{titulo}</figcaption>
      <div className="flex flex-col gap-3" aria-hidden>
        {gastos.map((g) => (
          <div key={g.concepto} className="flex flex-col gap-1">
            <div className="flex justify-between gap-2 font-bold">
              <span>{g.concepto}</span>
              <span>{soles(g.monto)}</span>
            </div>
            <div className="h-4 w-full rounded-pastilla bg-fondo-suave">
              <div
                className="h-4 rounded-pastilla bg-accion-primaria"
                style={{ width: `${Math.max(Math.round((g.monto / maximo) * 100), 2)}%` }}
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
              Gasto
            </th>
            <th scope="col" className="border-b border-borde-sutil py-2 text-right">
              Monto
            </th>
          </tr>
        </thead>
        <tbody>
          {gastos.map((g) => (
            <tr key={g.concepto}>
              <th scope="row" className="border-b border-borde-sutil py-2 pr-2 font-normal">
                {g.concepto}
              </th>
              <td className="border-b border-borde-sutil py-2 text-right">{soles(g.monto)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <th scope="row" className="py-2 pr-2">
              Total
            </th>
            <td className="py-2 text-right">{soles(total)}</td>
          </tr>
        </tfoot>
      </table>
    </figure>
  );
}
