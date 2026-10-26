import { soles } from "@/compartido/dinero";

// Gráfico de lo que se juntó cada semana (HU-COB-14, VEC-TRA-01): una barra por semana, siempre con su tabla equivalente y con los
// montos escritos: nunca depende del color ni de la forma (WCAG 1.4.1, 1.1.1).

type Semana = { etiqueta: string; total: number };

export function GraficoSemanas({
  semanas,
  titulo = "Lo que se juntó cada semana",
  columna = "Se juntó",
}: {
  semanas: Semana[];
  titulo?: string;
  columna?: string;
}) {
  const maximo = Math.max(...semanas.map((s) => s.total), 1);
  const total = semanas.reduce((suma, s) => suma + s.total, 0);
  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="text-titulo-3">{titulo}</figcaption>
      <div aria-hidden className="flex h-40 items-end gap-3 border-b border-borde-fuerte">
        {semanas.map((s) => (
          <div key={s.etiqueta} className="flex h-full min-w-0 flex-1 items-end justify-center">
            <div
              className="w-full max-w-8 rounded-t-control bg-accion-primaria"
              style={{ height: `${Math.max(Math.round((s.total / maximo) * 100), s.total === 0 ? 0 : 2)}%` }}
            />
          </div>
        ))}
      </div>
      <p className="text-pequeno text-texto-secundario">Los mismos datos del gráfico</p>
      <div className="overflow-x-auto" role="region" aria-label={`${titulo}, en tabla`} tabIndex={0}>
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{titulo}, en soles</caption>
          <thead>
            <tr>
              <th scope="col" className="border-b border-borde-sutil py-2 pr-2">
                Semana
              </th>
              <th scope="col" className="border-b border-borde-sutil py-2 pl-2 text-right">
                {columna}
              </th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((s) => (
              <tr key={s.etiqueta}>
                <th scope="row" className="border-b border-borde-sutil py-2 pr-2 font-normal">
                  {s.etiqueta}
                </th>
                <td className="border-b border-borde-sutil py-2 pl-2 text-right">{soles(s.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <th scope="row" className="py-2 pr-2">
                Total
              </th>
              <td className="py-2 pl-2 text-right">{soles(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </figure>
  );
}
