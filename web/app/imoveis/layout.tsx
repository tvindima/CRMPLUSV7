import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todos os Imóveis",
  description: "Explore o nosso portefólio completo de imóveis. Apartamentos, moradias, terrenos e imóveis comerciais para venda e arrendamento em Portugal.",
  keywords: ["imóveis", "apartamentos", "moradias", "casas", "venda", "arrendamento", "Portugal", "Leiria"],
  openGraph: {
    title: "Todos os Imóveis | Imóveis Mais",
    description: "Explore o nosso portefólio completo de imóveis. Apartamentos, moradias, terrenos e imóveis comerciais para venda e arrendamento.",
    type: "website",
    url: "https://imoveismais-site.vercel.app/imoveis",
  },
  alternates: {
    canonical: "https://imoveismais-site.vercel.app/imoveis",
  },
};

export default function ImoveisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
