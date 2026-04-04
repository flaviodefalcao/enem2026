import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Questões do ENEM com resolução comentada e análise de desempenho",
    template: "%s | ENEM Leadgen",
  },
  description:
    "Plataforma de questões do ENEM com resolução comentada, leitura estratégica da prova e páginas otimizadas para descoberta orgânica.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
