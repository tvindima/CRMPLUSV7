'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";

export default function NewOpportunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    propertyId: "",
    stage: "contact" as 'contact' | 'visit' | 'proposal' | 'negotiation' | 'closed',
    value: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Creating opportunity:", formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push("/backoffice/opportunities");
    } catch (error) {
      console.error("Erro ao criar oportunidade:", error);
      setLoading(false);
    }
  }

  return (
    <BackofficeLayout title="Nova Oportunidade">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Nova Oportunidade de Negócio</h1>
          <p className="text-sm text-[#999]">Registar interesse de cliente em imóvel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Identificação</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Nome do Cliente *</label>
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Ex: João Silva"
              />
            </div>

            <div>
              <label className="block text-sm text-[#999]">Referência do Imóvel *</label>
              <input
                type="text"
                required
                value={formData.propertyId}
                onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Ex: TV1234"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Detalhes</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-[#999]">Fase *</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({...formData, stage: e.target.value as any})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white focus:border-[#E10600]/50 focus:outline-none"
                >
                  <option value="contact">Contacto Inicial</option>
                  <option value="visit">Visita Agendada</option>
                  <option value="proposal">Proposta Enviada</option>
                  <option value="negotiation">Em Negociação</option>
                  <option value="closed">Fechado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#999]">Valor Estimado (€)</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                  placeholder="250000"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Observações</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Notas</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={4}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Detalhes da oportunidade..."
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
              {loading ? "A criar..." : "Criar Oportunidade"}
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}
