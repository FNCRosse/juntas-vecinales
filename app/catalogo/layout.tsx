import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

// Catálogo interno de componentes: existe en local, en el CI y en las previews; en producción
// responde 404 (VERCEL_ENV=production).
export const metadata: Metadata = {
  title: "Catálogo de componentes",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  return children;
}
