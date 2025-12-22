import Link from "next/link";
import { SectionHeader } from "../../components/SectionHeader";

const posts = [
  { slug: "tudo-comeca-na-tua-agencia", title: "TUDO COMEÇA NA TUA AGÊNCIA", date: "2025-01-10" },
  { slug: "integração-total", title: "Integração total website ↔ CRM PLUS", date: "2025-02-01" },
];

export default function BlogPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Blog"
        title="Insights CRM PLUS"
        subtitle="Artigos para marketing, automação e growth imobiliário."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="rounded-xl border border-[#2A2A2E] bg-[#151518] p-4 hover:border-[#E10600]"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#E10600]">{post.date}</p>
            <h3 className="text-lg font-semibold text-white">{post.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
