import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import AplicarPreferenciasDispositivo from "./components/AplicarPreferenciasDispositivo";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rose",
  description:
    "Um ritual diário de 5 minutos para autoestima, imagem corporal e relação com a comida.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#FBF6F0",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-tema="clara"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-fundo font-sans text-texto pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <AplicarPreferenciasDispositivo />
        {children}
      </body>
    </html>
  );
}
