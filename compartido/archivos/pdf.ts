import PDFDocument from "pdfkit";

// Adaptador de PDF (docs/BACKEND.md §8): pdfkit con PDF etiquetado y en español, para que el lector
// de pantalla lea los títulos y el orden del documento.

/** Una sección del documento: su título y pares "dato: valor". */
export type SeccionPdf = { titulo: string; filas: [etiqueta: string, valor: string][] };

export type DocumentoPdf = {
  titulo: string;
  /** Líneas bajo el título: para quién es, cuándo se generó. */
  subtitulos: string[];
  secciones: SeccionPdf[];
  pie: string;
};

const LETRA = { titulo: 22, seccion: 16, texto: 12 };

export function generarPdf({ titulo, subtitulos, secciones, pie }: DocumentoPdf): Promise<Buffer> {
  const doc = new PDFDocument({
    tagged: true,
    lang: "es-PE",
    displayTitle: true,
    pdfVersion: "1.7",
    margin: 56,
    info: { Title: titulo, Author: "Junta Vecinal de Villa de Fátima" },
  });
  const partes: Buffer[] = [];
  doc.on("data", (parte: Buffer) => partes.push(parte));
  const terminado = new Promise<Buffer>((resolver) => doc.on("end", () => resolver(Buffer.concat(partes))));

  const raiz = doc.struct("Document");
  doc.addStructure(raiz);
  raiz.add(doc.struct("H1", {}, () => doc.font("Helvetica-Bold").fontSize(LETRA.titulo).text(titulo)));
  for (const linea of subtitulos) {
    raiz.add(doc.struct("P", {}, () => doc.font("Helvetica").fontSize(LETRA.texto).text(linea)));
  }
  for (const seccion of secciones) {
    doc.moveDown();
    raiz.add(
      doc.struct("H2", {}, () => doc.font("Helvetica-Bold").fontSize(LETRA.seccion).text(seccion.titulo)),
    );
    for (const [etiqueta, valor] of seccion.filas) {
      raiz.add(
        doc.struct("P", {}, () =>
          doc
            .font("Helvetica-Bold")
            .fontSize(LETRA.texto)
            .text(`${etiqueta}: `, { continued: true })
            .font("Helvetica")
            .text(valor),
        ),
      );
    }
  }
  doc.moveDown();
  raiz.add(doc.struct("P", {}, () => doc.font("Helvetica").fontSize(LETRA.texto).text(pie)));
  raiz.end();
  doc.end();
  return terminado;
}
