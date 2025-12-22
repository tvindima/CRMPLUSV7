import Link from "next/link";
import { SectionHeader } from "../../../components/SectionHeader";

type Props = { params: { slug: string } };

export default function EmpreendimentoDetail({ params }: Props) {
  const name = params.slug.replace(/-/g, " ");
  return (
    <div className="space-y-4">
      <Link href="/empreendimentos" className="text-sm text-[#E10600] hover:underline">
        ← Empreendimentos
      </Link>
      <SectionHeader
        eyebrow="Empreendimento"
        title={name}
        subtitle="Microsite pronto para galeria, planta e CTA. Integração futura com API pública."
      />
      <div className="rounded-xl border border-[#2A2A2E] bg-[#151518] p-6 text-sm text-[#C5C5C5]">
        Placeholder de conteúdo. Adiciona imagens, plantas e ficha técnica.
      </div>
    </div>
  );
}
