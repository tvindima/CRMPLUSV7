import Link from "next/link";
import { SectionHeader } from "../../components/SectionHeader";

const teams = [
  { slug: "lisboa-prime", name: "Lisboa Prime", lead: "Nuno Faria" },
  { slug: "porto-team", name: "Porto Team", lead: "João Olaio" },
];

export default function EquipasPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Equipas" title="Microsites de equipa" subtitle="Navegação Agency → Team → Agent → Property." />
      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => (
          <Link
            key={team.slug}
            href={`/equipas/${team.slug}`}
            className="rounded-xl border p-4 transition-colors"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background-secondary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            <h3 className="text-lg font-semibold text-white">{team.name}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Team lead: {team.lead}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
