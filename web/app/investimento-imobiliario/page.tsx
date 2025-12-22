import { LeadForm } from "../../components/LeadForm";
import { SectionHeader } from "../../components/SectionHeader";

export default function InvestimentoPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SectionHeader
        eyebrow="Investimento"
        title="Investimento imobiliário"
        subtitle="Microsite pronto para captar investidores, fundos e parceiros."
      />
      <LeadForm source="investimento-imobiliario" title="Quero investir" cta="Contactar consultor" />
    </div>
  );
}
