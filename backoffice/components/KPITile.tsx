type Props = {
  label: string;
  value: string;
  trend?: string;
};

export function KPITile({ label, value, trend }: Props) {
  return (
    <div className="rounded-xl border border-[#2A2A2E] bg-[#151518] p-4 shadow-sm shadow-[#E10600]/10">
      <p className="text-sm text-[#C5C5C5]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {trend && <p className="text-xs text-[#E10600]">{trend}</p>}
    </div>
  );
}
