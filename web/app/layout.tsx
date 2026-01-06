import "../styles/globals.css";
import { ReactNode } from "react";
import { Poppins } from "next/font/google";
import { Providers } from "../components/Providers";
import { ClientHeader } from "../components/ClientHeader";
import { ClientFooter } from "../components/ClientFooter";
import { getSiteUrl } from "../src/lib/siteUrl";

const siteUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Imóveis Mais - Casas e Investimentos à Medida",
    template: "%s | Imóveis Mais"
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  description: "Encontre a casa perfeita ou o investimento ideal em Portugal. Moradias, apartamentos, terrenos e imóveis comerciais com a Imóveis Mais.",
  keywords: ["imóveis", "casas", "apartamentos", "moradias", "venda", "arrendamento", "Portugal", "Leiria", "investimento imobiliário"],
  authors: [{ name: "Imóveis Mais" }],
  creator: "Imóveis Mais",
  publisher: "Imóveis Mais",
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: siteUrl,
    siteName: "Imóveis Mais",
    title: "Imóveis Mais - Casas e Investimentos à Medida",
    description: "Encontre a casa perfeita ou o investimento ideal em Portugal. Moradias, apartamentos, terrenos e imóveis comerciais.",
    images: [
      {
        url: "/brand/agency-logo.svg",
        width: 1200,
        height: 630,
        alt: "Imóveis Mais",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Imóveis Mais - Casas e Investimentos à Medida",
    description: "Encontre a casa perfeita ou o investimento ideal em Portugal.",
    images: ["/brand/agency-logo.svg"],
  },
  // Ícones para todas as páginas (inclui login)
  robots: {
    index: false,  // 🚫 BLOQUEADO - Site em testes
    follow: false, // 🚫 BLOQUEADO - Site em testes
    googleBot: {
      index: false,  // 🚫 BLOQUEADO - Site em testes
      follow: false, // 🚫 BLOQUEADO - Site em testes
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon.png',
  },
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt" className={poppins.variable}>
      <body className="bg-[#0B0B0D] text-white">
        <Providers>
        <div className="min-h-screen bg-grid">
          <ClientHeader />

          <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">{children}</main>

          <ClientFooter />
        </div>
        </Providers>
      </body>
    </html>
  );
}
