import { soles } from "@/compartido/dinero";

// Gráfico de lo cobrado cada semana, por medio de pago (HU-COB-13 CA1). Siempre con su tabla equivalente y con los montos
// escritos: nunca depende del color ni de la forma (WCAG 1.4.1, 1.1.1). Cada medio tiene su nombre en la leyenda.

type Semana = { inicio: string; etiqueta: string; digital: number; efectivo: number; total: number };

export function GraficoRecaudacion({
  semanas,
  digital,
  efectivo,
}: {
  semanas: Semana[];
  digital: number;
  efectivo: number;
}) {
  const maximo = Math.max(...semanas.flatMap((s) => [s.digital, s.efectivo]), 1);
  const alto = (monto: number) => `${Math.max(Math.round((monto / maximo) * 100), monto === 0 ? 0 : 2)}%`;
  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="text-titulo-3">Lo cobrado cada semana, por medio de pago</figcaption>
      <ul className="flex flex-col gap-2">
        <li className="flex items-center gap-2">
          <span aria-hidden className="size-4 shrink-0 rounded-pastilla bg-accion-primaria" />
          Digital (Yape, Plin, transferencia)
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="size-4 shrink-0 rounded-pastilla bg-texto-info" />
          En efectivo
        </li>
      </ul>
      <div aria-hidden className="flex h-40 items-end gap-3 border-b border-borde-fuerte">
        {semanas.map((s) => (
          <div key={s.inicio} className="flex h-full min-w-0 flex-1 items-end justify-center gap-1">
            <div
              className="w-full max-w-8 rounded-t-control bg-accion-primaria"
              style={{ height: alto(s.digital) }}
            />
            <div
              className="w-full max-w-8 rounded-t-control bg-texto-info"
              style={{ height: alto(s.efectivo) }}
            />
          </div>
        ))}
      </div>
      <p className="text-pequeno text-texto-secundario">Los mismos datos del gráfico</p>
      <div
        className="overflow-x-auto"
        role="region"
        aria-label="Lo cobrado cada semana, en tabla"
        tabIndex={0}
      >
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Lo cobrado cada semana, por medio de pago, en soles</caption>
          <thead>
            <tr>
              <th scope="col" className="border-b border-borde-sutil py-2 pr-2">
                Semana
              </th>
              <th scope="col" className="border-b border-borde-sutil px-2 py-2 text-right">
                Digital
              </th>
              <th scope="col" className="border-b border-borde-sutil px-2 py-2 text-right">
                En efectivo
              </th>
              <th scope="col" className="border-b border-borde-sutil py-2 pl-2 text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((s) => (
              <tr key={s.inicio}>
                <th scope="row" className="border-b border-borde-sutil py-2 pr-2 font-normal">
                  {s.etiqueta}
                </th>
                <td className="border-b border-borde-sutil px-2 py-2 text-right">{soles(s.digital)}</td>
                <td className="border-b border-borde-sutil px-2 py-2 text-right">{soles(s.efectivo)}</td>
                <td className="border-b border-borde-sutil py-2 pl-2 text-right">{soles(s.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <th scope="row" className="py-2 pr-2">
                Total
              </th>
              <td className="px-2 py-2 text-right">{soles(digital)}</td>
              <td className="px-2 py-2 text-right">{soles(efectivo)}</td>
              <td className="py-2 pl-2 text-right">{soles(digital + efectivo)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </figure>
  );
}
