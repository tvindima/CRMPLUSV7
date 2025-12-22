import { LeadForm } from "../../components/LeadForm";
import { SectionHeader } from "../../components/SectionHeader";

export default function ComprarCasaPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SectionHeader
        eyebrow="Comprar"
        title="Quero comprar casa"
        subtitle="Filtra oportunidades e envia lead direto ao agente certo."
      />
      <LeadForm source="quero-comprar-casa" title="Quero comprar" cta="Enviar interesse" />
    </div>
  );
}
