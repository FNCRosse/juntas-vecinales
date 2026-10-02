import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lee sus fuentes de su carpeta en disco: no se empaqueta (compartido/archivos/pdf.ts).
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
