/** Responde un PDF para descargar, sin guardarlo en ningún caché. */
export const respuestaPdf = ({ pdf, nombreArchivo }: { pdf: Buffer; nombreArchivo: string }) =>
  new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${nombreArchivo}"`,
      "cache-control": "private, no-store",
    },
  });
