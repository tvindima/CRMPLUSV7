import Link from "next/link";
import { SectionHeader } from "../../../components/SectionHeader";

type Props = { params: { slug: string } };

export default function EmpreendimentoDetail({ params }: Props) {
  const name = params.slug.replace(/-/g, " ");
  return (
    <div className="space-y-4">
      <Link href="/empreendimentos" className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>
        ← Empreendimentos
      </Link>
      <SectionHeader
        eyebrow="Empreendimento"
        title={name}
        subtitle="Microsite pronto para galeria, planta e CTA. Integração futura com API pública."
      />
      <div className="rounded-xl border p-6 text-sm" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)', color: 'var(--color-text-muted)' }}>
        Placeholder de conteúdo. Adiciona imagens, plantas e ficha técnica.
      </div>
    </div>
  );
}
