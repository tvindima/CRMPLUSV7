type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <div className="space-y-2">
      {eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-[#E10600]">{eyebrow}</p>}
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      {subtitle && <p className="max-w-2xl text-sm text-[#C5C5C5]">{subtitle}</p>}
    </div>
  );
}
