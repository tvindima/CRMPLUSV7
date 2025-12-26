"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useCompare, CompareProperty } from "@/contexts/CompareContext";

interface AddExternalPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddExternalPropertyModal({ isOpen, onClose }: AddExternalPropertyModalProps) {
  const { addToCompare, canAddMore } = useCompare();
  const [formData, setFormData] = useState({
    url: "",
    titulo: "",
    preco: "",
    tipologia: "",
    area_util: "",
    quartos: "",
    casas_banho: "",
    localizacao: "",
    tipo_negocio: "Venda",
    tipo_imovel: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.url.trim()) {
      setError("O link do imóvel é obrigatório");
      return;
    }

    if (!formData.preco || parseFloat(formData.preco) <= 0) {
      setError("O preço é obrigatório");
      return;
    }

    // Gerar um ID negativo único para imóveis externos
    const externalId = -Date.now();

    const property: CompareProperty = {
      id: externalId,
      referencia: `EXT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      titulo: formData.titulo || "Imóvel Externo",
      preco: parseFloat(formData.preco),
      tipologia: formData.tipologia || undefined,
      area_util: formData.area_util ? parseFloat(formData.area_util) : undefined,
      quartos: formData.quartos ? parseInt(formData.quartos) : undefined,
      casas_banho: formData.casas_banho ? parseInt(formData.casas_banho) : undefined,
      localizacao: formData.localizacao || undefined,
      tipo_negocio: formData.tipo_negocio,
      tipo_imovel: formData.tipo_imovel || undefined,
      // Guardar a URL no campo imagem para termos acesso depois
      // Usamos um prefixo especial para identificar que é uma URL externa
      imagem: `external:${formData.url}`,
    };

    const added = addToCompare(property);
    if (added) {
      setSuccess(true);
      // Reset form
      setFormData({
        url: "",
        titulo: "",
        preco: "",
        tipologia: "",
        area_util: "",
        quartos: "",
        casas_banho: "",
        localizacao: "",
        tipo_negocio: "Venda",
        tipo_imovel: "",
      });
      // Fechar após 1.5s
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } else {
      setError("Não foi possível adicionar. Verifique se já atingiu o limite de 5 imóveis.");
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[#2A2A2E] bg-[#151518] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Adicionar Imóvel Externo</h2>
            <p className="mt-1 text-sm text-[#7A7A7A]">
              Compare com imóveis de outros sites ou portais
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#7A7A7A] transition hover:bg-[#2A2A2E] hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL do imóvel */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
              Link do Imóvel *
            </label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://www.idealista.pt/imovel/..."
              className="w-full rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white placeholder-[#7A7A7A] focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
            />
          </div>

          {/* Título */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
              Título / Descrição
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ex: T3 com vista mar em Cascais"
              className="w-full rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white placeholder-[#7A7A7A] focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
            />
          </div>

          {/* Preço e Tipo de Negócio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
                Preço (€) *
              </label>
              <input
                type="number"
                name="preco"
                value={formData.preco}
                onChange={handleChange}
                placeholder="250000"
                min="0"
                className="w-full rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white placeholder-[#7A7A7A] focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
                Tipo de Negócio
              </label>
              <select
                name="tipo_negocio"
                value={formData.tipo_negocio}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
              >
                <option value="Venda">Venda</option>
                <option value="Arrendamento">Arrendamento</option>
              </select>
            </div>
          </div>

          {/* Tipologia e Tipo de Imóvel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
                Tipologia
              </label>
              <select
                name="tipologia"
                value={formData.tipologia}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
              >
                <option value="">Selecionar</option>
                <option value="T0">T0</option>
                <option value="T1">T1</option>
                <option value="T2">T2</option>
                <option value="T3">T3</option>
                <option value="T4">T4</option>
                <option value="T5">T5</option>
                <option value="T6+">T6+</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
                Tipo de Imóvel
              </label>
              <select
                name="tipo_imovel"
                value={formData.tipo_imovel}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
              >
                <option value="">Selecionar</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Moradia">Moradia</option>
                <option value="Terreno">Terreno</option>
                <option value="Loja">Loja</option>
                <option value="Escritório">Escritório</option>
                <option value="Armazém">Armazém</option>
                <option value="Quinta">Quinta</option>
              </select>
            </div>
          </div>

          {/* Área e Quartos */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
                Área (m²)
              </label>
              <input
                type="number"
                name="area_util"
                value={formData.area_util}
                onChange={handleChange}
                placeholder="120"
                min="0"
                className="w-full rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white placeholder-[#7A7A7A] focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
                Quartos
              </label>
              <input
                type="number"
                name="quartos"
                value={formData.quartos}
                onChange={handleChange}
                placeholder="3"
                min="0"
                className="w-full rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white placeholder-[#7A7A7A] focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
                WCs
              </label>
              <input
                type="number"
                name="casas_banho"
                value={formData.casas_banho}
                onChange={handleChange}
                placeholder="2"
                min="0"
                className="w-full rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white placeholder-[#7A7A7A] focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
              />
            </div>
          </div>

          {/* Localização */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
              Localização
            </label>
            <input
              type="text"
              name="localizacao"
              value={formData.localizacao}
              onChange={handleChange}
              placeholder="Ex: Lisboa, Cascais"
              className="w-full rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white placeholder-[#7A7A7A] focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
              ✓ Imóvel adicionado à comparação!
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#2A2A2E] px-4 py-2.5 text-sm font-medium text-[#D1D5DB] transition hover:bg-[#2A2A2E]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canAddMore}
              className="flex-1 rounded-lg bg-[#E10600] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C10500] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Adicionar à Comparação
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Usar portal para renderizar fora do DOM tree normal
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}
