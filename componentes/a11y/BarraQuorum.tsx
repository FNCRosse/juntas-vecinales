import { CircleCheck, Info } from "lucide-react";

// Barra de quórum del prototipo (DAS01): el avance hasta el mínimo, con la línea que marca el mínimo, su
// frase y una insignia con ícono y texto (nunca solo color, WCAG 1.4.1). La barra es decorativa para el
// lector de pantalla: lee la frase de `etiqueta`, igual que el prototipo.

export function BarraQuorum({
  confirmados,
  padronTotal,
  requerido,
  alcanza,
  texto,
}: {
  confirmados: number;
  padronTotal: number;
  requerido: number;
  alcanza: boolean;
  texto: string;
}) {
  const pct = (n: number) => `${padronTotal > 0 ? Math.min(100, Math.round((n / padronTotal) * 100)) : 0}%`;
  return (
    <div className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={`Barra de quórum: ${confirmados} de ${padronTotal} casas. El mínimo es ${requerido}.`}
        className="relative h-6 w-full overflow-hidden rounded-pastilla border border-borde-control bg-fondo-suave"
      >
        <div className="h-full bg-accion-primaria" style={{ width: pct(confirmados) }} />
        <div
          className="absolute inset-y-0 w-1 bg-texto-principal"
          style={{ left: pct(requerido) }}
          aria-hidden
        />
      </div>
      <p>{texto}</p>
      <span
        className={`inline-flex items-center gap-1 self-start rounded-pastilla border px-3 text-pequeno font-bold ${
          alcanza
            ? "border-borde-exito bg-fondo-exito text-texto-exito"
            : "border-borde-info bg-fondo-info text-texto-info"
        }`}
      >
        {alcanza ? (
          <CircleCheck aria-hidden className="size-icono-pequeno" />
        ) : (
          <Info aria-hidden className="size-icono-pequeno" />
        )}
        {alcanza ? "Quórum proyectado suficiente" : "Todavía no alcanza el quórum"}
      </span>
    </div>
  );
}
