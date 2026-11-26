import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "Sillabe",
  title: "Sillabe — Impara a leggere",
  description:
    "Gioco educativo per imparare a leggere in italiano con la tecnica sillabica.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sillabe",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFB347",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/* Portrait-only notice: visible only in landscape (product constraint) */}
        <div className="landscape-warning" aria-hidden="true">
          <p>Ruota il telefono in verticale per giocare 🐛</p>
        </div>
        <div className="app-shell flex min-h-dvh flex-col">{children}</div>
      </body>
    </html>
  );
}
