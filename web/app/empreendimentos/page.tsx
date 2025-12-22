import { SectionHeader } from "../../components/SectionHeader";
import Link from "next/link";

export default function EmpreendimentosPage() {
  const items = [
    { slug: "skyline-towers", nome: "Skyline Towers", status: "Em comercialização" },
    { slug: "vista-river", nome: "Vista River", status: "Lançamento" },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Empreendimentos"
        title="Catálogo de empreendimentos"
        subtitle="Carrosséis premium para projetos de investimento."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/empreendimentos/${item.slug}`}
            className="rounded-xl border border-[#2A2A2E] bg-[#151518] p-4 hover:border-[#E10600]"
          >
            <h3 className="text-lg font-semibold text-white">{item.nome}</h3>
            <p className="text-sm text-[#C5C5C5]">{item.status}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
