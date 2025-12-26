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

// Função para extrair dados de diferentes portais
async function extractPropertyData(url: string): Promise<ExtractedData | null> {
  try {
    // Detectar o portal pelo URL
    const urlLower = url.toLowerCase();
    
    // Tentar fazer fetch via proxy para evitar CORS
    // Em produção, isto deveria ser um endpoint do backend
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'text/html',
      },
    });
    
    if (!response.ok) {
      throw new Error('Não foi possível aceder ao site');
    }
    
    const html = await response.text();
    
    // Extrair dados baseado no portal
    if (urlLower.includes('idealista.pt') || urlLower.includes('idealista.com')) {
      return extractFromIdealista(html, url);
    } else if (urlLower.includes('imovirtual.com')) {
      return extractFromImovirtual(html, url);
    } else if (urlLower.includes('casasapo.pt') || urlLower.includes('casa.sapo.pt')) {
      return extractFromCasaSapo(html, url);
    } else if (urlLower.includes('supercasa.pt')) {
      return extractFromSupercasa(html, url);
    } else if (urlLower.includes('remax.pt')) {
      return extractFromRemax(html, url);
    } else if (urlLower.includes('era.pt')) {
      return extractFromEra(html, url);
    } else {
      // Tentar extração genérica com meta tags
      return extractGeneric(html, url);
    }
  } catch (error) {
    console.error('Erro ao extrair dados:', error);
    return null;
  }
}

// Extração do Idealista
function extractFromIdealista(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: 'Idealista' };
  
  // Título
  const titleMatch = html.match(/<h1[^>]*class="[^"]*main-info__title[^"]*"[^>]*>([^<]+)/i) ||
                     html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim().replace(/ - Idealista.*$/i, '');
  
  // Preço
  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ''));
  
  // Tipologia
  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();
  
  // Área
  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);
  
  // Quartos
  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);
  
  // WCs
  const bathMatch = html.match(/(\d+)\s*(?:casa[s]?\s*de\s*banho|wc)/i);
  if (bathMatch) data.casas_banho = parseInt(bathMatch[1]);
  
  // Localização
  const locMatch = html.match(/data-location="([^"]+)"/i) ||
                   html.match(/<span[^>]*class="[^"]*main-info__title-minor[^"]*"[^>]*>([^<]+)/i);
  if (locMatch) data.localizacao = locMatch[1].trim();
  
  // Tipo de negócio
  if (url.includes('/arrendar/') || url.includes('/alugar/') || html.includes('arrendamento')) {
    data.tipo_negocio = 'Arrendamento';
  } else {
    data.tipo_negocio = 'Venda';
  }
  
  // Tipo de imóvel
  if (html.match(/moradia|vivenda|casa/i)) data.tipo_imovel = 'Moradia';
  else if (html.match(/apartamento|andar/i)) data.tipo_imovel = 'Apartamento';
  else if (html.match(/terreno/i)) data.tipo_imovel = 'Terreno';
  else if (html.match(/loja|comercial/i)) data.tipo_imovel = 'Loja';
  
  return data;
}

// Extração do Imovirtual
function extractFromImovirtual(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: 'Imovirtual' };
  
  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim().replace(/ \| Imovirtual.*$/i, '');
  
  const priceMatch = html.match(/(\d{1,3}(?:\s?\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/\s/g, ''));
  
  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();
  
  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);
  
  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);
  
  const bathMatch = html.match(/(\d+)\s*(?:casa[s]?\s*de\s*banho|wc)/i);
  if (bathMatch) data.casas_banho = parseInt(bathMatch[1]);
  
  data.tipo_negocio = url.includes('/arrendar') ? 'Arrendamento' : 'Venda';
  
  return data;
}

// Extração do Casa Sapo
function extractFromCasaSapo(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: 'Casa Sapo' };
  
  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim();
  
  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ''));
  
  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();
  
  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);
  
  data.tipo_negocio = url.includes('/alugar') || url.includes('/arrendar') ? 'Arrendamento' : 'Venda';
  
  return data;
}

// Extração do Supercasa
function extractFromSupercasa(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: 'Supercasa' };
  
  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim();
  
  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ''));
  
  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();
  
  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);
  
  data.tipo_negocio = url.includes('/arrendar') ? 'Arrendamento' : 'Venda';
  
  return data;
}

// Extração do Remax
function extractFromRemax(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: 'RE/MAX' };
  
  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim();
  
  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ''));
  
  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();
  
  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);
  
  return data;
}

// Extração da ERA
function extractFromEra(html: string, url: string): ExtractedData {
  const data: ExtractedData = { fonte: 'ERA' };
  
  const titleMatch = html.match(/<h1[^>]*>([^<]+)/i) || html.match(/<title>([^<]+)/i);
  if (titleMatch) data.titulo = titleMatch[1].trim();
  
  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ''));
  
  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();
  
  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);
  
  return data;
}

// Extração genérica usando meta tags e Open Graph
function extractGeneric(html: string, url: string): ExtractedData {
  const data: ExtractedData = {};
  
  // Open Graph title
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
                       html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
  if (ogTitleMatch) data.titulo = ogTitleMatch[1].trim();
  else {
    const titleMatch = html.match(/<title>([^<]+)/i);
    if (titleMatch) data.titulo = titleMatch[1].trim();
  }
  
  // Tentar extrair preço
  const priceMatch = html.match(/(\d{1,3}(?:[.,]\d{3})*)\s*€/);
  if (priceMatch) data.preco = parseInt(priceMatch[1].replace(/[.,]/g, ''));
  
  // Tipologia
  const typoMatch = html.match(/\b(T\d+)\b/i);
  if (typoMatch) data.tipologia = typoMatch[1].toUpperCase();
  
  // Área
  const areaMatch = html.match(/(\d+)\s*m²/);
  if (areaMatch) data.area_util = parseInt(areaMatch[1]);
  
  // Quartos
  const roomsMatch = html.match(/(\d+)\s*quarto/i);
  if (roomsMatch) data.quartos = parseInt(roomsMatch[1]);
  
  // Localização via Open Graph
  const locMatch = html.match(/<meta[^>]*property="og:locality"[^>]*content="([^"]+)"/i);
  if (locMatch) data.localizacao = locMatch[1].trim();
  
  // Detectar fonte pelo domínio
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    data.fonte = domain.charAt(0).toUpperCase() + domain.slice(1).split('.')[0];
  } catch {}
  
  return data;
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
      const data = await extractPropertyData(url);
      
      if (data) {
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
    } catch (err) {
      setError("Erro ao analisar o link. Preencha os dados manualmente.");
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
