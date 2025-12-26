"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useCompare, CompareProperty } from "@/contexts/CompareContext";

interface AddExternalPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtractedData {
  titulo?: string;
  preco?: number;
  tipologia?: string;
  area_util?: number;
  quartos?: number;
  casas_banho?: number;
  localizacao?: string;
  tipo_negocio?: string;
  tipo_imovel?: string;
  fonte?: string;
}

export function AddExternalPropertyModal({ isOpen, onClose }: AddExternalPropertyModalProps) {
  const { addToCompare, canAddMore } = useCompare();
  const [url, setUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    preco: "",
    tipologia: "",
    area_util: "",
    quartos: "",
    casas_banho: "",
    localizacao: "",
    tipo_negocio: "Venda",
    tipo_imovel: "",
    fonte: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError("");
    setExtracted(false);
  };

  const handleExtract = async () => {
    if (!url.trim()) {
      setError("Cole o link do imóvel");
      return;
    }

    // Validar se é uma URL
    try {
      new URL(url);
    } catch {
      setError("Link inválido. Introduza um URL completo (ex: https://...)");
      return;
    }

    setExtracting(true);
    setError("");

    try {
      // Usar a API server-side para fazer o scraping (evita CORS)
      const response = await fetch("/api/scrape-property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao analisar o link");
      }

      if (result.success && result.data) {
        const data: ExtractedData = result.data;
        setFormData({
          titulo: data.titulo || "",
          preco: data.preco?.toString() || "",
          tipologia: data.tipologia || "",
          area_util: data.area_util?.toString() || "",
          quartos: data.quartos?.toString() || "",
          casas_banho: data.casas_banho?.toString() || "",
          localizacao: data.localizacao || "",
          tipo_negocio: data.tipo_negocio || "Venda",
          tipo_imovel: data.tipo_imovel || "",
          fonte: data.fonte || "",
        });
        setExtracted(true);
      } else {
        setError("Não foi possível extrair os dados automaticamente. Preencha manualmente.");
        setExtracted(true);
      }
    } catch (err: unknown) {
      console.error("Erro ao extrair dados:", err);
      const message = err instanceof Error ? err.message : "Erro ao analisar o link";
      setError(`${message}. Preencha os dados manualmente.`);
      setExtracted(true);
    } finally {
      setExtracting(false);
    }
  };

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

    if (!url.trim()) {
      setError("O link do imóvel é obrigatório");
      return;
    }

    if (!formData.preco || parseFloat(formData.preco) <= 0) {
      setError("O preço é obrigatório");
      return;
    }

    const externalId = -Date.now();

    const property: CompareProperty = {
      id: externalId,
      referencia: `EXT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      titulo: formData.titulo || formData.fonte || "Imóvel Externo",
      preco: parseFloat(formData.preco),
      tipologia: formData.tipologia || undefined,
      area_util: formData.area_util ? parseFloat(formData.area_util) : undefined,
      quartos: formData.quartos ? parseInt(formData.quartos) : undefined,
      casas_banho: formData.casas_banho ? parseInt(formData.casas_banho) : undefined,
      localizacao: formData.localizacao || undefined,
      tipo_negocio: formData.tipo_negocio,
      tipo_imovel: formData.tipo_imovel || undefined,
      imagem: `external:${url}`,
    };

    const added = addToCompare(property);
    if (added) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setUrl("");
        setExtracted(false);
        setFormData({
          titulo: "",
          preco: "",
          tipologia: "",
          area_util: "",
          quartos: "",
          casas_banho: "",
          localizacao: "",
          tipo_negocio: "Venda",
          tipo_imovel: "",
          fonte: "",
        });
        onClose();
      }, 1500);
    } else {
      setError("Não foi possível adicionar. Limite de 5 imóveis atingido.");
    }
  };

  const handleClose = () => {
    setUrl("");
    setExtracted(false);
    setFormData({
      titulo: "",
      preco: "",
      tipologia: "",
      area_util: "",
      quartos: "",
      casas_banho: "",
      localizacao: "",
      tipo_negocio: "Venda",
      tipo_imovel: "",
      fonte: "",
    });
    setError("");
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[#2A2A2E] bg-[#151518] p-6 shadow-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Adicionar Imóvel Externo</h2>
            <p className="mt-1 text-sm text-[#7A7A7A]">
              Cole o link e extraímos os dados automaticamente
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-[#7A7A7A] transition hover:bg-[#2A2A2E] hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Portais suportados */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#7A7A7A]">
          <span>Portais suportados:</span>
          <span className="rounded bg-[#2A2A2E] px-2 py-0.5">Idealista</span>
          <span className="rounded bg-[#2A2A2E] px-2 py-0.5">Imovirtual</span>
          <span className="rounded bg-[#2A2A2E] px-2 py-0.5">Casa Sapo</span>
          <span className="rounded bg-[#2A2A2E] px-2 py-0.5">Supercasa</span>
          <span className="rounded bg-[#2A2A2E] px-2 py-0.5">RE/MAX</span>
          <span className="rounded bg-[#2A2A2E] px-2 py-0.5">ERA</span>
          <span className="rounded bg-[#2A2A2E] px-2 py-0.5">C21</span>
          <span className="rounded bg-[#2A2A2E] px-2 py-0.5">KW</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL do imóvel */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#D1D5DB]">
              Link do Imóvel
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="Cole aqui o link do anúncio..."
                className="flex-1 rounded-lg border border-[#2A2A2E] bg-[#1C1C1F] px-4 py-2.5 text-white placeholder-[#7A7A7A] focus:border-[#E10600] focus:outline-none focus:ring-1 focus:ring-[#E10600]"
                autoFocus
              />
              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting || !url.trim()}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {extracting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    A analisar...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Analisar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dados extraídos / Formulário */}
          {extracted && (
            <>
              {/* Fonte detectada */}
              {formData.fonte && (
                <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Dados extraídos de {formData.fonte}
                </div>
              )}

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

              {/* Área, Quartos, WCs */}
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
            </>
          )}

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
              onClick={handleClose}
              className="flex-1 rounded-lg border border-[#2A2A2E] px-4 py-2.5 text-sm font-medium text-[#D1D5DB] transition hover:bg-[#2A2A2E]"
            >
              Cancelar
            </button>
            {extracted && (
              <button
                type="submit"
                disabled={!canAddMore || !formData.preco}
                className="flex-1 rounded-lg bg-[#E10600] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C10500] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Adicionar à Comparação
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return null;
}
