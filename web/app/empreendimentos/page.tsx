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
            className="rounded-xl border p-4 transition"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)' }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{item.nome}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.status}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
