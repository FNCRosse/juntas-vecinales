import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Junta Vecinal de Villa de Fátima",
  description: "Plataforma de la Junta Vecinal de Villa de Fátima",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body className="text-lg leading-relaxed">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:inline-block focus:min-h-12 focus:p-3"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
