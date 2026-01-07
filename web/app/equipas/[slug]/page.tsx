// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { SectionHeader } from "../../../components/SectionHeader";

type Props = { params: { slug: string } };

export default function EquipaDetail({ params }: Props) {
  const name = params.slug.replace(/-/g, " ");
  return (
    <div className="space-y-4">
      <Link href="/equipas" className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>
        ← Equipas
      </Link>
      <SectionHeader
        eyebrow="Equipa"
        title={name}
        subtitle="Estrutura pronta para listar agentes, propriedades e KPIs desta equipa."
      />
      <div 
        className="rounded-xl border p-6 text-sm"
        style={{ 
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-background-secondary)',
          color: 'var(--color-text-muted)'
        }}
      >
        Insere aqui carrossel de propriedades da equipa e ligações para cada agente.
      </div>
    </div>
  );
}
