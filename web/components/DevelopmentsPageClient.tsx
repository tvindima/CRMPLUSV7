'use client';

import { SectionHeader } from "./SectionHeader";
import Link from "next/link";
import { useTerminology } from "@/contexts/TerminologyContext";

interface DevelopmentsClientProps {
  items: Array<{ slug: string; nome: string; status: string }>;
}

export function DevelopmentsPageClient({ items }: DevelopmentsClientProps) {
  const { terms, sector } = useTerminology();

  // Título e subtítulo baseados no sector
  const getTitle = () => {
    switch (sector) {
      case 'automotive':
        return 'Novidades e Destaques';
      case 'boats':
        return 'Novos Modelos';
      case 'machinery':
        return 'Novos Equipamentos';
      default:
        return 'Catálogo de empreendimentos';
    }
  };

  const getSubtitle = () => {
    switch (sector) {
      case 'automotive':
        return 'Descubra as últimas novidades e veículos em destaque.';
      case 'boats':
        return 'Conheça os novos modelos e embarcações em destaque.';
      case 'machinery':
        return 'Veja os novos equipamentos e máquinas disponíveis.';
      default:
        return 'Carrosséis premium para projetos de investimento.';
    }
  };

  const getEyebrow = () => {
    switch (sector) {
      case 'automotive':
        return 'Novidades';
      case 'boats':
        return 'Novos Modelos';
      case 'machinery':
        return 'Novidades';
      default:
        return 'Empreendimentos';
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={getEyebrow()}
        title={getTitle()}
        subtitle={getSubtitle()}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/empreendimentos/${item.slug}`}
            className="rounded-xl border p-4 transition"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background-secondary)' }}
          >
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{item.nome}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.status}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
