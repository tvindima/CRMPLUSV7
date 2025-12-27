import { KPITile } from "../../backoffice/components/KPITile";
import { BackofficeLayout } from "../../backoffice/components/BackofficeLayout";

const kpis = [
  { label: "Imóveis ativos", value: "328", trend: "+8%" },
  { label: "Leads novas", value: "42", trend: "+3%" },
  { label: "Visitas agendadas", value: "18", trend: "+12%" },
  { label: "Negócios em curso", value: "25", trend: "-1%" },
];

export default function DashboardPage() {
  return (
    <BackofficeLayout title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPITile key={kpi.label} label={kpi.label} value={kpi.value} trend={kpi.trend} />
        ))}
      </div>
    </BackofficeLayout>
  );
}
