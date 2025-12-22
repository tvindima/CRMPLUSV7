import { LeadForm } from "../../components/LeadForm";
import { SectionHeader } from "../../components/SectionHeader";

export default function VenderCasaPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SectionHeader
        eyebrow="Vender"
        title="Quero vender casa"
        subtitle="Integração direta no CRM PLUS com source=venda."
      />
      <LeadForm source="quero-vender-casa" title="Quero vender" cta="Enviar pedido" />
    </div>
  );
}
