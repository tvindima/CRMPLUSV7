'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";

export default function NewActivityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "call" as 'call' | 'email' | 'meeting' | 'note',
    subject: "",
    description: "",
    date: "",
    relatedTo: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Creating activity:", formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push("/backoffice/dashboard");
    } catch (error) {
      console.error("Erro ao criar atividade:", error);
      setLoading(false);
    }
  }

  return (
    <BackofficeLayout title="Nova Atividade">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Registar Nova Atividade</h1>
          <p className="text-sm text-[#999]">Documentar interação com cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Tipo de Atividade</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Tipo *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white focus:border-[#E10600]/50 focus:outline-none"
              >
                <option value="call">Chamada</option>
                <option value="email">Email</option>
                <option value="meeting">Reunião</option>
                <option value="note">Nota</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[#999]">Assunto *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Ex: Contacto inicial sobre T3 em Lisboa"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Detalhes</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-[#999]">Data *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white focus:border-[#E10600]/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[#999]">Relacionado com</label>
                <input
                  type="text"
                  value={formData.relatedTo}
                  onChange={(e) => setFormData({...formData, relatedTo: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                  placeholder="Cliente ou Ref. Imóvel"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Descrição</h3>
            
            <div>
              <label className="block text-sm text-[#999]">Notas *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={5}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Descreva a atividade em detalhe..."
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
              {loading ? "A criar..." : "Registar Atividade"}
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}
