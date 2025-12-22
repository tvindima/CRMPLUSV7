'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/backoffice/components/BackofficeLayout";

export default function NewVisitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    propertyRef: "",
    date: "",
    time: "",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Creating visit:", formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push("/backoffice/visits");
    } catch (error) {
      console.error("Erro ao agendar visita:", error);
      setLoading(false);
    }
  }

  return (
    <BackofficeLayout title="Agendar Visita">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Agendar Nova Visita</h1>
          <p className="text-sm text-[#999]">Marcar visita a imóvel com cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Cliente e Imóvel</h3>
            
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
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Data e Hora</h3>
            
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
                <label className="block text-sm text-[#999]">Hora *</label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white focus:border-[#E10600]/50 focus:outline-none"
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
                rows={3}
                className="mt-1 w-full rounded-lg border border-[#23232B] bg-[#0F0F12] px-4 py-2.5 text-white placeholder-[#555] focus:border-[#E10600]/50 focus:outline-none"
                placeholder="Informações adicionais sobre a visita..."
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
              {loading ? "A agendar..." : "Agendar Visita"}
            </button>
          </div>
        </form>
      </div>
    </BackofficeLayout>
  );
}
