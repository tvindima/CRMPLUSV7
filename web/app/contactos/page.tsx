import { LeadForm } from "../../components/LeadForm";
import { SectionHeader } from "../../components/SectionHeader";

export default function ContactosPage() {
  return (
    <div className="space-y-8">
        <SectionHeader
          eyebrow="Contacto"
          title="Fala com a agência"
          subtitle="Formulário ligado ao endpoint /leads (ou fallback local)."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-[#1F1F22] bg-[#0F0F10] p-6">
            <p className="text-lg font-semibold">Contactos diretos</p>
            <p className="text-sm text-[#C5C5C5]">Telefone: —</p>
            <p className="text-sm text-[#C5C5C5]">Email: —</p>
            <p className="text-sm text-[#C5C5C5]">Morada: —</p>
            <p className="text-xs text-[#C5C5C5]">TODO: Substituir por layout definitivo quando existirem renders oficiais.</p>
          </div>
          <LeadForm source="contactos" />
        </div>
    </div>
  );
}
