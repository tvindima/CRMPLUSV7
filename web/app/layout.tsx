import "../styles/globals.css";
import { ReactNode } from "react";
import { Poppins } from "next/font/google";
import { Providers } from "../components/Providers";
import { ClientHeader } from "../components/ClientHeader";
import { ClientFooter } from "../components/ClientFooter";
import { DynamicTitle } from "../components/DynamicTitle";
import { getSiteUrl } from "../src/lib/siteUrl";

const siteUrl = getSiteUrl();

// Metadata base - será sobrescrito dinamicamente pelo DynamicTitle
export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Imobiliária",
    template: "%s"
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  description: "Encontre a casa perfeita ou o investimento ideal em Portugal.",
  keywords: ["imóveis", "casas", "apartamentos", "moradias", "venda", "arrendamento", "Portugal", "investimento imobiliário"],
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
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
      <body className="text-white" style={{ backgroundColor: 'var(--color-background, #0B0B0D)' }}>
        <Providers>
          <DynamicTitle />
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
