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
          <div className="space-y-3 rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)' }}>
            <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Contactos diretos</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Telefone: —</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Email: —</p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Morada: —</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>TODO: Substituir por layout definitivo quando existirem renders oficiais.</p>
          </div>
          <LeadForm source="contactos" />
        </div>
    </div>
  );
}
