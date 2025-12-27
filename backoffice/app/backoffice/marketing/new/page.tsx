'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";

export default function NewMarketingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: "",
    type: "social" as 'social' | 'email' | 'sms' | 'print',
    targetAudience: "",
    budget: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Creating marketing action:", formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push("/backoffice/dashboard");
    } catch (error) {
      console.error("Erro ao criar ação de marketing:", error);
      setLoading(false);
    }
  }

  return (
    <BackofficeLayout title="Nova Ação de Marketing">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Nova Ação de Marketing</h1>
          <p className="text-sm text-[#999]">Planear campanha de divulgação</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Campanha</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Nome da Campanha *</label>
              <input
                type="text"
                required
                value={formData.campaignName}
                onChange={(e) => setFormData({...formData, campaignName: e.target.value})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Ex: Lançamento Novos T3 Lisboa"
              />
            </div>

            <div>
              <label className="block text-sm text-[#999]">Tipo *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white focus:border-[#E10600]/50 focus:outline-none"
              >
                <option value="social">Redes Sociais</option>
                <option value="email">Email Marketing</option>
                <option value="sms">SMS</option>
                <option value="print">Material Impresso</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Detalhes</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Público-Alvo</label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Ex: Compradores em Lisboa, 30-50 anos"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm text-[#999]">Orçamento (€)</label>
                <input
                  type="text"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-sm text-[#999]">Data Início</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white focus:border-[#E10600]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[#999]">Data Fim</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white focus:border-[#E10600]/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Descrição</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Objetivos e Detalhes *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={5}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Descreva os objetivos da campanha, mensagem principal, canais a utilizar..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 rounded-lg border border-[#23232B] bg-transparent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#1a1a22]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[#E10600] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#c00500] disabled:opacity-50"
            >
              {loading ? "A criar..." : "Criar Campanha"}
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}
