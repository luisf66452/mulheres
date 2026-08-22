import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import AplicarPreferenciasDispositivo from "./components/AplicarPreferenciasDispositivo";
import RegistrarServiceWorker from "./components/RegistrarServiceWorker";
import TikTokPixel from "./components/TikTokPixel";
import TikTokPageView from "./components/tiktok/TikTokPageView";
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
  appleWebApp: {
    capable: true,
    title: "Rose",
    statusBarStyle: "default",
  },
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
      <head>
        {/* Guarda o evento beforeinstallprompt caso ele dispare antes do
            useEffect de usePwaInstall montar (o evento nao espera a
            hidratacao — se perdido, nao ha como recupera-lo depois). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__rosePwaInstallEvent = null;
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  window.__rosePwaInstallEvent = e;
});`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-fundo font-sans text-texto pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <AplicarPreferenciasDispositivo />
        <RegistrarServiceWorker />
        <TikTokPixel />
        <TikTokPageView />
        {children}
      </body>
    </html>
  );
}
