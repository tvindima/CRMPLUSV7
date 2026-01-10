'use client';

import { useEffect, useState } from "react";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { ChartBarIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import { useTerminology } from "@/context/TerminologyContext";

type ReportStats = {
  total_properties: number;
  total_leads: number;
  total_agents: number;
  properties_by_status: { available: number; reserved: number; sold: number };
};

export default function RelatoriosPage() {
  const { term } = useTerminology();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/dashboard/kpis');
      if (response.ok) {
        const data = await response.json();
        setStats({
          total_properties: data.propriedades_ativas || 0,
          total_leads: data.novas_leads_7d || 0,
          total_agents: data.agentes_ativos || 0,
          properties_by_status: {
            available: data.propriedades_ativas || 0,
            reserved: 0,
            sold: 0,
          },
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackofficeLayout title="Relatórios">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Relatórios</h1>
        <p className="text-sm text-[#999]">Análise de desempenho e estatísticas</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar estatísticas...</div>
      ) : (
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
              <ChartBarIcon className="h-5 w-5 text-[#E10600]" />
              Resumo Geral
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-[#151518] p-4">
                <p className="text-sm text-[#999]">Total {term('items', 'Itens')}</p>
                <p className="text-2xl font-bold text-white">{stats?.total_properties || 0}</p>
              </div>
              <div className="rounded-lg bg-[#151518] p-4">
                <p className="text-sm text-[#999]">Leads (7 dias)</p>
                <p className="text-2xl font-bold text-white">{stats?.total_leads || 0}</p>
              </div>
              <div className="rounded-lg bg-[#151518] p-4">
                <p className="text-sm text-[#999]">{term('agents', 'Comerciais')} Ativos</p>
                <p className="text-2xl font-bold text-white">{stats?.total_agents || 0}</p>
              </div>
            </div>
          </div>

          {/* Exportar */}
          <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
              <DocumentArrowDownIcon className="h-5 w-5 text-[#E10600]" />
              Exportar Dados
            </h2>
            <p className="text-sm text-[#999]">
              Funcionalidade de exportação em desenvolvimento.
            </p>
          </div>
        </div>
      )}
    </BackofficeLayout>
  );
}
