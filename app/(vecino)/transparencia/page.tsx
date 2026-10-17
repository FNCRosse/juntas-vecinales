import { Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import { exigirActor } from "@/app/_sesion/sesion";
import { soles } from "@/compartido/dinero";
import { BotonEnlace } from "@/componentes/a11y/Boton";
import { ListaVerMas } from "@/componentes/a11y/ListaVerMas";
import { historialPublico } from "@/modulos/transparencia/aplicacion/historial";

export const metadata: Metadata = { title: "Actas y balances" };

// VEC-TRA-02 Actas y balances (HU-ASA-12 CA1 y CA3; HU-ASA-11 CA2): el historial público, del evento más
// nuevo al más antiguo, para todo vecino con sesión, en 5 tarjetas (3 en vista grande) con "Ver más" (R-11).
// Cada una dice qué es, de cuándo, un resumen y un solo botón: el detalle completo está en el PDF o en el
// balance (VEC-TRA-03).
export default async function ActasYBalances() {
  const sesion = await exigirActor(["VECINO", "VECINO_ADULTO_MAYOR"], "/entrar");
  const historial = await historialPublico(sesion);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-titulo-1">Actas y balances</h1>
        <p className="text-texto-secundario">
          Todo lo que se acordó y lo que se juntó en cada actividad, del más nuevo al más antiguo.
        </p>
      </div>
      {historial.length ? (
        <ListaVerMas
          etiqueta="Actas y balances"
          elementos={historial.map((r) => (
            <article
              key={`${r.tipo}-${r.id}`}
              className="flex flex-col gap-2 rounded-tarjeta border border-borde-sutil bg-fondo-superficie p-4 senior:p-6 shadow-tarjeta"
            >
              <p className="text-pequeno text-texto-secundario">{r.tipo === "ACTA" ? "Acta" : "Balance"}</p>
              <h2 className="text-titulo-3">
                {r.titulo} del {r.fechaEvento.toLowerCase()}
              </h2>
              {r.tipo === "ACTA" ? (
                <>
                  <p>
                    {r.acuerdos.length === 1 ? "Acuerdo" : "Acuerdos"}: {r.acuerdos.join(", ")}
                  </p>
                  <BotonEnlace
                    href={`/api/transparencia/actas/${r.id}/pdf`}
                    variante="secundario"
                    icono={Download}
                  >
                    Descargar acta (PDF)
                  </BotonEnlace>
                </>
              ) : (
                <>
                  <p>Saldo final: {soles(r.totales.utilidadNeta)}</p>
                  <BotonEnlace
                    href={`/transparencia/balances/${r.id}`}
                    variante="secundario"
                    icono={FileText}
                  >
                    Ver el balance
                  </BotonEnlace>
                </>
              )}
            </article>
          ))}
        />
      ) : (
        <div role="status" className="flex flex-col items-center gap-2 p-6 text-center">
          <FileText aria-hidden className="size-icono text-texto-secundario" />
          <strong>Todavía no hay actas ni balances publicados</strong>
          <span>Cuando la directiva publique uno, lo verá aquí.</span>
        </div>
      )}
    </div>
  );
}
