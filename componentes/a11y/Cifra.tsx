/** Una cifra dentro de una tarjeta (prototipo DIN01 y XIN01): nombre, monto o cantidad en grande y, si lo hay, su detalle. */
export function Cifra({ titulo, valor, detalle }: { titulo: string; valor: string; detalle?: string }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 shadow-tarjeta senior:p-6">
      <span className="text-texto-secundario">{titulo}</span>
      <strong className="text-titulo-2">{valor}</strong>
      {detalle && <span className="text-pequeno text-texto-secundario">{detalle}</span>}
    </div>
  );
}
