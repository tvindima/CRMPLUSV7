import { Metadata } from "next";
import { getSiteUrl } from "../../src/lib/siteUrl";

const siteUrl = getSiteUrl();

// Metadata genérico - será sobrescrito dinamicamente pelo componente cliente
export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explore o nosso portefólio completo.",
  openGraph: {
    title: "Catálogo",
    description: "Explore o nosso portefólio completo.",
    type: "website",
    url: `${siteUrl}/imoveis`,
  },
  alternates: {
    canonical: `${siteUrl}/imoveis`,
  },
};

export default function ImoveisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
