import { LeadForm } from "../../components/LeadForm";
import { SectionHeader } from "../../components/SectionHeader";

export default function AvaliacaoPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SectionHeader
        eyebrow="Avaliação"
        title="Avaliação de imóvel"
        subtitle="Pede avaliação gratuita; form ligado ao /leads com source=avaliacao."
      />
      <LeadForm source="avaliacao-imovel" title="Quero avaliar o meu imóvel" cta="Pedir avaliação" />
    </div>
  );
}
