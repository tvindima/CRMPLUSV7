import Link from "next/link";
import { SectionHeader } from "../../../components/SectionHeader";

type Props = { params: { slug: string } };

export default function EquipaDetail({ params }: Props) {
  const name = params.slug.replace(/-/g, " ");
  return (
    <div className="space-y-4">
      <Link href="/equipas" className="text-sm text-[#E10600] hover:underline">
        ← Equipas
      </Link>
      <SectionHeader
        eyebrow="Equipa"
        title={name}
        subtitle="Estrutura pronta para listar agentes, propriedades e KPIs desta equipa."
      />
      <div className="rounded-xl border border-[#2A2A2E] bg-[#151518] p-6 text-sm text-[#C5C5C5]">
        Insere aqui carrossel de propriedades da equipa e ligações para cada agente.
      </div>
    </div>
  );
}
