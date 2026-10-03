// @HU-GAR-12 @HU-GAR-14
import type { SeccionPdf } from "@/compartido/archivos/pdf";
import type { Transaccion } from "@/compartido/bd/cliente";
import { fechaLarga } from "@/compartido/fechas";
import { CATEGORIAS, ESTADOS, lugarEnTexto, numeroVisible } from "@/modulos/incidencias/dominio/queja";
import { hashDenunciante } from "@/modulos/incidencias/infraestructura/identidadProtegida";
import {
  anonimizarQuejasDe,
  quejasConNombreDe,
} from "@/modulos/incidencias/infraestructura/repositorioQuejas";

/**
 * La sección de reportes de la copia de datos (HU-GAR-12 CA1): sus quejas con nombre, con el lugar y las
 * coordenadas que guardó. Las anónimas no se incluyen: así nada las une a su nombre (CLAUDE.md del módulo).
 */
export async function datosPersonales(usuarioId: string): Promise<SeccionPdf[]> {
  const quejas = await quejasConNombreDe(usuarioId);
  return [
    {
      titulo: "Reportes de incidentes",
      filas: [
        ["Reportes enviados con su nombre", String(quejas.length)],
        ...quejas.map((q): [string, string] => [
          `${numeroVisible(q.numero)} del ${fechaLarga(q.fechaRegistro)}`,
          [
            CATEGORIAS[q.categoria],
            lugarEnTexto(q.manzana, q.referencia),
            q.latitud != null && q.longitud != null ? `coordenadas ${q.latitud}, ${q.longitud}` : null,
            ESTADOS[q.estado],
          ]
            .filter(Boolean)
            .join(" · "),
        ]),
      ],
    },
  ];
}

/** La parte de incidencias de una cancelación aprobada (HU-GAR-14 CA3), en la transacción de identidad. */
export async function anonimizar(usuarioId: string, tx: Transaccion) {
  await anonimizarQuejasDe(tx, usuarioId, hashDenunciante(usuarioId));
}
