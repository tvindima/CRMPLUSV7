'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";

export default function NewProposalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    propertyRef: "",
    proposedValue: "",
    conditions: "",
    expiryDate: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Creating proposal:", formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push("/backoffice/proposals");
    } catch (error) {
      console.error("Erro ao criar proposta:", error);
      setLoading(false);
    }
  }

  return (
    <BackofficeLayout title="Nova Proposta">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Registar Nova Proposta</h1>
          <p className="text-sm text-[#999]">Documentar proposta de compra/arrendamento</p>
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
                value={formData.propertyRef}
                onChange={(e) => setFormData({...formData, propertyRef: e.target.value})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Ex: TV1234"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Valores</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-[#999]">Valor Proposto (€) *</label>
                <input
                  type="text"
                  required
                  value={formData.proposedValue}
                  onChange={(e) => setFormData({...formData, proposedValue: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                  placeholder="250000"
                />
              </div>

              <div>
                <label className="block text-sm text-[#999]">Validade da Proposta</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white focus:border-[#E10600]/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Condições</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Condições da Proposta</label>
              <textarea
                value={formData.conditions}
                onChange={(e) => setFormData({...formData, conditions: e.target.value})}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Ex: Sujeito a financiamento bancário, entrega em 60 dias..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Observações</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Notas Internas</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Anotações adicionais..."
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
              {loading ? "A criar..." : "Criar Proposta"}
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}
