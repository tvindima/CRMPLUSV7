import Link from "next/link";
import { SectionHeader } from "../../../components/SectionHeader";

type Props = { params: { slug: string } };

export default function BlogDetail({ params }: Props) {
  const title = params.slug.replace(/-/g, " ").toUpperCase();
  return (
    <div className="space-y-4">
      <Link href="/blog" className="text-sm text-[#E10600] hover:underline">
        ← Blog
      </Link>
      <SectionHeader eyebrow="Artigo" title={title} subtitle="Placeholder de conteúdo. Substituir por CMS/MDX." />
      <div className="rounded-xl border border-[#2A2A2E] bg-[#151518] p-6 text-sm text-[#C5C5C5]">
        Conteúdo do artigo. Integração futura com fonte de dados externa.
      </div>
    </div>
  );
}
