import PDFDocument from "pdfkit";

// Afiche A4 a color para pegar en el barrio (HU-ASA-01 CA2, DIR-34). Usa la paleta de la guía visual
// (docs/guia-visual) y, como el resto de PDF, sale etiquetado y en español: el lector de pantalla lee
// título, fecha, hora, lugar y motivo en ese orden; los adornos van marcados como artefactos.

export type DatosAfiche = {
  junta: string;
  /** "Asamblea ordinaria" / "Asamblea extraordinaria". */
  titulo: string;
  fecha: string;
  hora: string;
  lugar: string;
  motivo: string;
  pie: string;
};

// Valores de la paleta de componentes/tokens (un PDF no puede leer variables CSS).
const COLOR = {
  blanco: "#FFFFFF",
  fondo: "#FBF7F1",
  texto: "#231D18",
  verde: "#0D5C53",
  verdeOscuro: "#07352F",
  terracota: "#9B4424",
  terracotaClaro: "#E59A78",
  azul: "#1F58A6",
  hoja: "#1F6B35",
  ambar: "#F2B53A",
  ambarClaro: "#FFF5DC",
};

const ANCHO = 595.28;
const ALTO = 841.89;
const LADO = 40;
const ANCHO_UTIL = ANCHO - LADO * 2;

export function generarAfiche(datos: DatosAfiche): Promise<Buffer> {
  const doc = new PDFDocument({
    tagged: true,
    lang: "es-PE",
    displayTitle: true,
    pdfVersion: "1.7",
    size: "A4",
    margin: 0,
    info: { Title: `${datos.titulo} · ${datos.junta}`, Author: datos.junta },
  });
  const partes: Buffer[] = [];
  doc.on("data", (parte: Buffer) => partes.push(parte));
  const terminado = new Promise<Buffer>((resolver) => doc.on("end", () => resolver(Buffer.concat(partes))));

  const adorno = (dibujar: () => void) => {
    doc.markContent("Artifact", { type: "Layout" });
    dibujar();
    doc.endMarkedContent();
  };
  const raiz = doc.struct("Document");
  doc.addStructure(raiz);
  const texto = (
    etiqueta: "H1" | "H2" | "P",
    contenido: string,
    x: number,
    y: number,
    opciones: PDFKit.Mixins.TextOptions & { fuente: string; tamano: number; color: string },
  ) => {
    const { fuente, tamano, color, ...resto } = opciones;
    raiz.add(
      doc.struct(etiqueta, {}, () =>
        doc
          .font(fuente)
          .fontSize(tamano)
          .fillColor(color)
          .text(contenido, x, y, { ...resto, ellipsis: true }),
      ),
    );
  };

  // Fondo y cabecera verde con banderines de colores.
  adorno(() => {
    doc.rect(0, 0, ANCHO, ALTO).fill(COLOR.fondo);
    doc.rect(0, 0, ANCHO, 190).fill(COLOR.verde);
    doc.circle(ANCHO - 30, 20, 110).fill(COLOR.verdeOscuro);
    doc.circle(ANCHO - 30, 20, 60).fill(COLOR.terracota);
    doc.circle(40, 175, 45).fill(COLOR.verdeOscuro);
    const banderines = [COLOR.ambar, COLOR.terracotaClaro, COLOR.blanco, COLOR.ambar];
    for (let i = 0; i * 34 < ANCHO + 34; i++) {
      doc
        .polygon([i * 34, 190], [i * 34 + 34, 190], [i * 34 + 17, 222])
        .fill(banderines[i % banderines.length]);
    }
  });

  texto("P", datos.junta.toUpperCase(), LADO, 34, {
    fuente: "Helvetica-Bold",
    tamano: 13,
    color: COLOR.ambar,
    width: ANCHO_UTIL - 120,
    characterSpacing: 1.5,
  });
  // El título va en una sola línea: baja de 44 puntos lo justo para que "ASAMBLEA EXTRAORDINARIA" quepa.
  const titulo = datos.titulo.toUpperCase();
  const ancho44 = doc.font("Helvetica-Bold").fontSize(44).widthOfString(titulo);
  texto("H1", titulo, LADO, 74, {
    fuente: "Helvetica-Bold",
    tamano: Math.min(44, Math.floor((44 * ANCHO_UTIL) / ancho44)),
    color: COLOR.blanco,
    width: ANCHO_UTIL,
    lineBreak: false,
  });
  texto("P", "¡Su participación cuenta!", LADO, 148, {
    fuente: "Helvetica-Bold",
    tamano: 16,
    color: COLOR.blanco,
    width: ANCHO_UTIL,
    height: 24,
  });

  // Tarjetas: cuándo y dónde. Cada una crece con su texto (el lugar admite hasta 160 letras).
  let y = 244;
  const tarjeta = (color: string, etiqueta: string, valor: string, tamano: number) => {
    const alto = doc
      .font("Helvetica-Bold")
      .fontSize(tamano)
      .heightOfString(valor, { width: ANCHO_UTIL - 150 });
    const altura = Math.max(56, alto + 28);
    adorno(() => {
      doc.roundedRect(LADO, y, ANCHO_UTIL, altura, 12).fill(COLOR.blanco);
      doc.roundedRect(LADO, y, 120, altura, 12).fill(color);
      doc.rect(LADO + 100, y, 20, altura).fill(color);
    });
    texto("H2", etiqueta, LADO + 10, y + altura / 2 - 9, {
      fuente: "Helvetica-Bold",
      tamano: 17,
      color: COLOR.blanco,
      width: 100,
      align: "center",
    });
    texto("P", valor, LADO + 136, y + (altura - alto) / 2, {
      fuente: "Helvetica-Bold",
      tamano,
      color: COLOR.texto,
      width: ANCHO_UTIL - 150,
      height: altura - 8,
    });
    y += altura + 12;
  };
  tarjeta(COLOR.terracota, "FECHA", datos.fecha.charAt(0).toUpperCase() + datos.fecha.slice(1), 22);
  tarjeta(COLOR.azul, "HORA", datos.hora, 22);
  tarjeta(COLOR.hoja, "LUGAR", datos.lugar, datos.lugar.length > 70 ? 15 : 20);

  // Motivo: el tamaño baja hasta que el texto entre en el espacio que deja la franja de abajo.
  const piePie = ALTO - 96;
  const topeMotivo = piePie - 24 - y - 54;
  const tamanoMotivo =
    [18, 16, 14, 12, 11, 10].find(
      (t) =>
        doc
          .font("Helvetica")
          .fontSize(t)
          .heightOfString(datos.motivo, { width: ANCHO_UTIL - 36 }) <= topeMotivo,
    ) ?? 10;
  adorno(() => {
    doc.roundedRect(LADO, y + 6, ANCHO_UTIL, piePie - 24 - y - 6, 12).fill(COLOR.ambarClaro);
    doc.roundedRect(LADO, y + 6, 10, piePie - 24 - y - 6, 5).fill(COLOR.ambar);
  });
  texto("H2", "Motivo de la reunión", LADO + 28, y + 22, {
    fuente: "Helvetica-Bold",
    tamano: 17,
    color: COLOR.terracota,
    width: ANCHO_UTIL - 56,
  });
  texto("P", datos.motivo, LADO + 28, y + 48, {
    fuente: "Helvetica",
    tamano: tamanoMotivo,
    color: COLOR.texto,
    width: ANCHO_UTIL - 56,
    height: topeMotivo,
  });

  // Franja de abajo: cómo confirmar.
  adorno(() => {
    doc.rect(0, piePie, ANCHO, ALTO - piePie).fill(COLOR.verdeOscuro);
    doc.rect(0, piePie, ANCHO, 8).fill(COLOR.ambar);
  });
  texto("P", datos.pie, LADO, piePie + 26, {
    fuente: "Helvetica-Bold",
    tamano: 15,
    color: COLOR.blanco,
    width: ANCHO_UTIL,
    align: "center",
    height: 56,
  });

  raiz.end();
  doc.end();
  return terminado;
}
