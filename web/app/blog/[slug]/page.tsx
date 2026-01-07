import Link from "next/link";
import { SectionHeader } from "../../../components/SectionHeader";

type Props = { params: { slug: string } };

export default function BlogDetail({ params }: Props) {
  const title = params.slug.replace(/-/g, " ").toUpperCase();
  return (
    <div className="space-y-4">
      <Link href="/blog" className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>
        ← Blog
      </Link>
      <SectionHeader eyebrow="Artigo" title={title} subtitle="Placeholder de conteúdo. Substituir por CMS/MDX." />
      <div className="rounded-xl border p-6 text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-muted)' }}>
        Conteúdo do artigo. Integração futura com fonte de dados externa.
      </div>
    </div>
  );
}
