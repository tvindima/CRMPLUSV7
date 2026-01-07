type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <div className="space-y-2">
      {eyebrow && <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--color-primary)' }}>{eyebrow}</p>}
      <h2 className="text-xl font-semibold md:text-2xl" style={{ color: 'var(--color-text)' }}>{title}</h2>
      {subtitle && <p className="max-w-2xl text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>}
    </div>
  );
}
