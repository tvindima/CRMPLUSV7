import { DevelopmentsPageClient } from "../../components/DevelopmentsPageClient";

export default function EmpreendimentosPage() {
  const items = [
    { slug: "skyline-towers", nome: "Skyline Towers", status: "Em comercialização" },
    { slug: "vista-river", nome: "Vista River", status: "Lançamento" },
  ];
  
  return <DevelopmentsPageClient items={items} />;
}
