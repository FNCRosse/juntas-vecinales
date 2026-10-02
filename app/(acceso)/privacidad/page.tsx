import type { Metadata } from "next";
import { Tarjeta } from "@/componentes/a11y/Tarjeta";

export const metadata: Metadata = { title: "Política de privacidad" };

// Política de privacidad completa (Ley N.° 29733 y su reglamento; docs/DATOS.md §6). Si cambia el
// texto, se sube VERSION_POLITICA (modulos/identidad/dominio/politica.ts) para volver a pedirla.

const SECCIONES: [string, string[]][] = [
  [
    "Quién cuida sus datos",
    [
      "La Junta Vecinal de Villa de Fátima es responsable de sus datos.",
      "La directiva y el administrador de la plataforma los usan solo para las tareas de la junta.",
    ],
  ],
  [
    "Qué datos guardamos",
    [
      "Su nombre, DNI, la vivienda donde vive y su número de WhatsApp.",
      "Sus cuotas y pagos, con las fotos de los comprobantes que envíe.",
      "Los reportes y quejas que haga, con sus fotos y su ubicación.",
      "Las visitas que anuncie y las entradas por la garita.",
    ],
  ],
  [
    "Para qué los usamos",
    [
      "Para calcular su cuota y darle sus recibos.",
      "Para avisarle de asambleas, cobros y respuestas a sus reportes.",
      "Para que la garita sepa quién vive en cada casa y quién viene de visita.",
      "No los vendemos ni los usamos para publicidad.",
    ],
  ],
  [
    "Quién los ve",
    [
      "Solo la directiva y el administrador. Sus vecinos no ven lo que usted debe.",
      "El vigilante solo ve si la reja se abre sola, no cuánto debe.",
      "En el mapa público, la ubicación de un reporte se muestra aproximada.",
    ],
  ],
  [
    "Dónde se guardan",
    [
      "En servicios de internet que contrata la junta: Vercel, Neon, Render y Cloudflare.",
      "Los avisos llegan por WhatsApp, de Meta.",
      "Algunos de estos servicios guardan los datos fuera del Perú, con medidas de seguridad.",
    ],
  ],
  [
    "Cuánto tiempo",
    [
      "Comprobantes y recibos: 5 años. Fotos de quejas: 1 año desde que se cierra la queja.",
      "Bitácora de la garita: 1 año. Enlaces de entrada vencidos: 30 días.",
      "Si cancela su cuenta, borramos su nombre, DNI y teléfono. Quedan solo los pagos que exige la ley.",
    ],
  ],
  [
    "Sus derechos",
    [
      "Puede pedir una copia de sus datos. Le respondemos en 20 días hábiles como máximo.",
      "Puede pedir que corrijamos, borremos o no mostremos sus datos. Le respondemos en 10 días hábiles.",
      "Lo pide desde Mi perfil o en persona a la administración de la junta.",
      "Si no le respondemos, puede reclamar ante la Autoridad Nacional de Protección de Datos Personales.",
    ],
  ],
];

export default function PoliticaDePrivacidad() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-titulo-1">Política de privacidad</h1>
      <p>Así cuida la junta los datos de cada vecino, según la Ley N.° 29733.</p>
      {SECCIONES.map(([titulo, parrafos]) => (
        <Tarjeta key={titulo} titulo={titulo}>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            {parrafos.map((parrafo) => (
              <li key={parrafo}>{parrafo}</li>
            ))}
          </ul>
        </Tarjeta>
      ))}
    </div>
  );
}
