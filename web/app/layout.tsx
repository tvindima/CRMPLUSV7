import "../styles/globals.css";
import { ReactNode } from "react";
import { Poppins } from "next/font/google";
import { Providers } from "../components/Providers";
import { ClientHeader } from "../components/ClientHeader";
import { ClientFooter } from "../components/ClientFooter";
import { DynamicTitle } from "../components/DynamicTitle";
import { getSiteUrl } from "../src/lib/siteUrl";
import type { Viewport } from "next";
import type { Branding } from "../contexts/BrandingContext";
import { cookies, headers } from "next/headers";

const siteUrl = getSiteUrl();
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://crmplusv7-production.up.railway.app";

// Viewport export separado (Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// Metadata base - será sobrescrito dinamicamente pelo DynamicTitle
export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "A carregar...",
    template: "%s"
  },
  description: "Encontre o que procura connosco.",
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

const fallbackBranding: Branding = {
  agency_name: "CRM Plus",
  agency_logo_url: "",
  agency_slogan: "O seu negócio, simplificado",
  primary_color: "#E10600",
  secondary_color: "#C5C5C5",
  background_color: "#0B0B0D",
  background_secondary: "#1A1A1F",
  text_color: "#FFFFFF",
  text_muted: "#9CA3AF",
  border_color: "#2A2A2E",
  accent_color: "#E10600",
  sector: "real_estate",
};

async function resolveTenantSlug(): Promise<string> {
  const cookieStore = await cookies();
  const tenantFromCookie = cookieStore.get("tenant_slug")?.value;
  if (tenantFromCookie) return tenantFromCookie;

  const requestHeaders = await headers();
  const tenantFromHeader = requestHeaders.get("x-tenant-slug");
  if (tenantFromHeader) return tenantFromHeader;

  const host = requestHeaders.get("host") || "";
  if (host.includes("luiscarlosgaspar")) return "luisgaspar";
  if (host.includes("luisgaspar.pt")) return "luisgaspar";
  if (host.includes("imoveismais")) return "imoveismais";
  if (host.includes(".crmplus.trioto.tech")) {
    const subdomain = host.split(".crmplus.trioto.tech")[0]?.split(":")[0];
    if (subdomain) return subdomain;
  }

  return "imoveismais";
}

async function getInitialBranding(): Promise<Branding> {
  try {
    const tenantSlug = await resolveTenantSlug();
    const response = await fetch(`${apiUrl}/public/branding`, {
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Slug": tenantSlug,
      },
      cache: "no-store",
    });

    if (!response.ok) return fallbackBranding;
    const data = await response.json();

    return {
      agency_name: data.agency_name || fallbackBranding.agency_name,
      agency_logo_url: data.agency_logo_url || fallbackBranding.agency_logo_url,
      agency_slogan: data.agency_slogan || fallbackBranding.agency_slogan,
      primary_color: data.primary_color || fallbackBranding.primary_color,
      secondary_color: data.secondary_color || fallbackBranding.secondary_color,
      background_color: data.background_color || fallbackBranding.background_color,
      background_secondary: data.background_secondary || fallbackBranding.background_secondary,
      text_color: data.text_color || fallbackBranding.text_color,
      text_muted: data.text_muted || fallbackBranding.text_muted,
      border_color: data.border_color || fallbackBranding.border_color,
      accent_color: data.accent_color || fallbackBranding.accent_color,
      sector: data.sector || fallbackBranding.sector,
      phone: data.phone,
      email: data.email,
      address: data.address,
    };
  } catch {
    return fallbackBranding;
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialBranding = await getInitialBranding();
  const initialThemeVars: Record<string, string> = {
    ["--color-primary" as string]: initialBranding.primary_color,
    ["--color-secondary" as string]: initialBranding.secondary_color,
    ["--color-background" as string]: initialBranding.background_color,
    ["--color-background-secondary" as string]: initialBranding.background_secondary,
    ["--color-text" as string]: initialBranding.text_color,
    ["--color-text-muted" as string]: initialBranding.text_muted,
    ["--color-border" as string]: initialBranding.border_color,
    ["--color-accent" as string]: initialBranding.accent_color,
  };

  return (
    <html lang="pt" className={poppins.variable} style={initialThemeVars}>
      <body className="text-white" style={{ backgroundColor: initialBranding.background_color }}>
        <Providers initialBranding={initialBranding}>
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
