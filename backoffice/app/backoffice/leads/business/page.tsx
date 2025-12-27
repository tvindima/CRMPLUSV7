'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";

export default function NewBusinessLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
    budget: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Creating business lead:", formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push("/backoffice/leads");
    } catch (error) {
      console.error("Erro ao criar lead:", error);
      setLoading(false);
    }
  }

  return (
    <BackofficeLayout title="Nova Lead de Negócio">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Nova Lead de Negócio</h1>
          <p className="text-sm text-[#999]">Registar potencial comprador/arrendatário</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Identificação</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Nome *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Ex: João Silva"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Contacto</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-[#999]">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm text-[#999]">Telefone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                  placeholder="+351 912 345 678"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Interesse</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Procura *</label>
              <input
                type="text"
                required
                value={formData.interest}
                onChange={(e) => setFormData({...formData, interest: e.target.value})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Ex: T3 em Lisboa"
              />
            </div>

            <div>
              <label className="block text-sm text-[#999]">Orçamento (€)</label>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="300000"
              />
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
                placeholder="Informações adicionais..."
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
              {loading ? "A criar..." : "Criar Lead"}
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}
