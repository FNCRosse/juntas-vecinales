import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Tipografía única de la guía visual (§2), publicada en la variable que leen los tokens.
const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-texto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Junta Vecinal de Villa de Fátima",
  description: "Plataforma de la Junta Vecinal de Villa de Fátima",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={atkinson.variable}>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:min-h-tactil focus:items-center focus:rounded-control focus:bg-fondo-superficie focus:px-4"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
