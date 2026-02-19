'use client';

import { FormEvent, useEffect, useMemo, useState } from "react";
import { UploadArea } from "./UploadArea";
import { BackofficeProperty, BackofficePropertyPayload } from "../../src/services/backofficeApi";
import { DISTRICTS, MUNICIPALITIES, PARISHES, CONDITIONS, ENERGY_CERTIFICATES } from "../data/portugal";
import { useTerminology } from "../../context/TerminologyContext";
import { useTenant } from "../../context/TenantContext";

export type PropertyFormSubmit = {
  payload: BackofficePropertyPayload;
  files: File[];
  imagesToKeep: string[];
  videoFile?: File | null;
};

type Props = {
  initial?: Partial<BackofficeProperty>;
  onSubmit: (data: PropertyFormSubmit) => void;
  loading?: boolean;
};

type Agent = {
  id: number;
  name: string;
  email: string;
};

const toNumber = (value: string): number | null => {
  if (!value) return null;
  const normalized = value.replace(",", ".").replace(/\s+/g, "");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

function moveArrayItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to) return items;
  if (from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function PropertyForm({ initial, onSubmit, loading }: Props) {
  const { term } = useTerminology();
  const { sector, isAutomotive } = useTenant();
  
  // Labels dinâmicos
  const itemLabel = term('item', 'Imóvel');
  const itemLabelLower = itemLabel.toLowerCase();
  
  // Opções dinâmicas baseadas no sector
  const BUSINESS_TYPES = sector === 'automotive' 
    ? ["Venda", "Aluguer"] 
    : ["Venda", "Arrendamento", "Trespasse"];
  
  const PROPERTY_TYPES = sector === 'automotive'
    ? ["Ligeiro", "Comercial", "Motociclo", "Pesado", "Outro"]
    : ["Apartamento", "Moradia", "Terreno", "Loja", "Armazém", "Escritório", "Garagem", "Prédio", "Quinta", "Casa Antiga"];
  
  const TYPOLOGIES = ["T0", "T1", "T2", "T3", "T4", "T5", "T6+"];
  const STATUSES = [
    { value: "AVAILABLE", label: "Disponível" },
    { value: "RESERVED", label: "Reservado" },
    { value: "SOLD", label: "Vendido" },
    { value: "CANCELLED", label: "Cancelado" }
  ];
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(initial?.agent_id?.toString() || "");
  const [reference, setReference] = useState(initial?.reference || "");
  const [autoReference, setAutoReference] = useState(true);
  const [title, setTitle] = useState(initial?.title || "");
  const [businessType, setBusinessType] = useState(initial?.business_type || "");
  const [propertyType, setPropertyType] = useState(initial?.property_type || "");
  const [typology, setTypology] = useState(initial?.typology || "");
  const [price, setPrice] = useState<string>(initial?.price?.toString() || "");
  const [usableArea, setUsableArea] = useState<string>(initial?.usable_area?.toString() || "");
  const [landArea, setLandArea] = useState<string>(initial?.land_area?.toString() || "");
  
  // Localização por partes
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState(initial?.municipality || "");
  const [selectedParish, setSelectedParish] = useState(initial?.parish || "");
  const [street, setStreet] = useState("");
  
  const [condition, setCondition] = useState(initial?.condition || "");
  const [energyCertificate, setEnergyCertificate] = useState(initial?.energy_certificate || "");
  const [status, setStatus] = useState(initial?.status || "AVAILABLE");
  const [description, setDescription] = useState(initial?.description || "");
  const [observations, setObservations] = useState(initial?.observations || "");
  const [existingImages, setExistingImages] = useState<string[]>(initial?.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Novos campos
  const [isPublished, setIsPublished] = useState((initial as any)?.is_published !== 0);
  const [isFeatured, setIsFeatured] = useState((initial as any)?.is_featured === 1);
  const [latitude, setLatitude] = useState<string>((initial as any)?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState<string>((initial as any)?.longitude?.toString() || "");
  const [bedrooms, setBedrooms] = useState<string>((initial as any)?.bedrooms?.toString() || "");
  const [bathrooms, setBathrooms] = useState<string>((initial as any)?.bathrooms?.toString() || "");
  const [parkingSpaces, setParkingSpaces] = useState<string>((initial as any)?.parking_spaces?.toString() || "");
  
  // Vídeo
  const [videoUrl, setVideoUrl] = useState<string>((initial as any)?.video_url || "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Carregar agentes
  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => setAgents(data))
      .catch(err => console.error('Erro ao carregar agentes:', err));
  }, []);

  // Inicializar campos de localização ao editar
  useEffect(() => {
    if (initial?.municipality) {
      // Tentar encontrar o distrito com base no município
      for (const [district, municipalities] of Object.entries(MUNICIPALITIES)) {
        if (municipalities.includes(initial.municipality)) {
          setSelectedDistrict(district);
          setSelectedMunicipality(initial.municipality);
          break;
        }
      }
    }
    if (initial?.parish) {
      setSelectedParish(initial.parish);
    }
    if (initial?.location) {
      // Extrair a rua da localização completa se possível
      const parts = initial.location.split(',');
      if (parts.length > 0) {
        setStreet(parts[0].trim());
      }
    }
  }, [initial]);

  // Auto-preencher referência quando selecionar agente
  useEffect(() => {
    if (selectedAgentId && autoReference && !initial) {
      fetch(`/api/properties/next-reference/${selectedAgentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.next_reference) {
            setReference(data.next_reference);
          }
        })
        .catch(err => console.error('Erro ao gerar referência:', err));
    }
  }, [selectedAgentId, autoReference, initial]);

  // Deriva localização completa dos campos selecionados
  const derivedLocation = useMemo(() => {
    const parts = [street, selectedParish, selectedMunicipality, selectedDistrict]
      .filter(Boolean);
    return parts.join(", ");
  }, [street, selectedParish, selectedMunicipality, selectedDistrict]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    
    // Validações obrigatórias
    if (!reference) errs.push("Referência é obrigatória");
    if (!selectedAgentId) errs.push(`${term('agent', 'Agente')} é obrigatório`);
    if (!selectedDistrict) errs.push("Distrito é obrigatório");
    if (!selectedMunicipality) errs.push("Concelho é obrigatório");
    
    const priceNumber = toNumber(price);
    if (priceNumber === null) errs.push("Preço é obrigatório e deve ser numérico");
    
    const usableAreaNumber = toNumber(usableArea);
    const landAreaNumber = toNumber(landArea);
    const agentIdNumber = Number(selectedAgentId);
    
    // ✅ IMAGENS SÃO OBRIGATÓRIAS - sem imagens o item não aparece corretamente no site
    if (existingImages.length === 0 && newFiles.length === 0) {
      errs.push(`❌ Pelo menos uma imagem é obrigatória para publicar o ${itemLabelLower}`);
    }
    
    // Validar novos campos opcionais
    const latNumber = latitude ? toNumber(latitude) : null;
    const lngNumber = longitude ? toNumber(longitude) : null;
    const bedroomsNumber = bedrooms ? Number(bedrooms) : null;
    const bathroomsNumber = bathrooms ? Number(bathrooms) : null;
    const parkingNumber = parkingSpaces ? Number(parkingSpaces) : null;
    
    setErrors(errs);
    if (errs.length) return;

    const payload: any = {
      reference,
      title: title || reference,
      business_type: businessType || null,
      property_type: propertyType || null,
      typology: typology || null,
      description: description || null,
      observations: observations || null,
      price: priceNumber,
      usable_area: usableAreaNumber,
      land_area: landAreaNumber,
      location: derivedLocation || null,
      municipality: selectedMunicipality,
      parish: selectedParish || null,
      condition: condition || null,
      energy_certificate: energyCertificate || null,
      status: status || "AVAILABLE",
      agent_id: agentIdNumber,
      images: existingImages,
      
      // Novos campos
      is_published: isPublished ? 1 : 0,
      is_featured: isFeatured ? 1 : 0,
      latitude: latNumber,
      longitude: lngNumber,
      bedrooms: bedroomsNumber,
      bathrooms: bathroomsNumber,
      parking_spaces: parkingNumber,
      video_url: videoUrl || null,
    };

    onSubmit({
      payload,
      files: newFiles,
      imagesToKeep: existingImages,
      videoFile: videoFile,
    });
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setNewFiles((prev) => [...prev, ...Array.from(fileList)]);
  };

  // Municípios disponíveis baseados no distrito selecionado
  const availableMunicipalities = useMemo(() => {
    if (!selectedDistrict) return [];
    return MUNICIPALITIES[selectedDistrict] || [];
  }, [selectedDistrict]);

  // Freguesias disponíveis baseadas no município selecionado
  const availableParishes = useMemo(() => {
    if (!selectedMunicipality) return [];
    return PARISHES[selectedMunicipality] || [];
  }, [selectedMunicipality]);

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Secção: Agente */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Agente Responsável</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-[#999]">Agente *</label>
            <select
              value={selectedAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                setAutoReference(true);
              }}
              disabled={!!initial}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600] disabled:opacity-50"
            >
              <option value="">Selecione um agente...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">
              Referência * 
              {selectedAgentId && autoReference && (
                <span className="ml-2 text-green-500 text-xs">(auto-gerada)</span>
              )}
            </label>
            <input
              value={reference}
              onChange={(e) => {
                setReference(e.target.value);
                setAutoReference(false);
              }}
              placeholder="Ex: TV1234"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
        </div>
      </div>

      {/* Secção: Identificação */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Identificação</h3>
        <div className="grid gap-3 md:grid-cols-1">
          <div>
            <label className="mb-1 block text-xs text-[#999]">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Apartamento T2 em Leiria"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
        </div>
      </div>

      {/* Secção: Tipo de negócio */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Tipo de Negócio</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-[#999]">Negócio *</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            >
              <option value="">Selecione...</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Tipo de {itemLabel} *</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            >
              <option value="">Selecione...</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Tipologia</label>
            <select
              value={typology}
              onChange={(e) => setTypology(e.target.value)}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            >
              <option value="">Selecione...</option>
              {TYPOLOGIES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Secção: Valores e Áreas */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Valores e Áreas</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-[#999]">Preço (€) *</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="150000"
              type="text"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Área útil (m²)</label>
            <input
              value={usableArea}
              onChange={(e) => setUsableArea(e.target.value)}
              placeholder="120"
              type="text"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Área terreno (m²)</label>
            <input
              value={landArea}
              onChange={(e) => setLandArea(e.target.value)}
              placeholder="500"
              type="text"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
        </div>
      </div>

      {/* Secção: Características */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Características</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-[#999]">Quartos</label>
            <input
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              placeholder="3"
              type="number"
              min="0"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Casas de Banho</label>
            <input
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              placeholder="2"
              type="number"
              min="0"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Lugares de Estacionamento</label>
            <input
              value={parkingSpaces}
              onChange={(e) => setParkingSpaces(e.target.value)}
              placeholder="1"
              type="number"
              min="0"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
        </div>
      </div>

      {/* Secção: Localização */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Localização</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-[#999]">Distrito *</label>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedMunicipality("");
                setSelectedParish("");
              }}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            >
              <option value="">Selecione um distrito...</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Concelho *</label>
            <select
              value={selectedMunicipality}
              onChange={(e) => {
                setSelectedMunicipality(e.target.value);
                setSelectedParish("");
              }}
              disabled={!selectedDistrict}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600] disabled:opacity-50"
            >
              <option value="">Selecione um concelho...</option>
              {availableMunicipalities.map((municipality) => (
                <option key={municipality} value={municipality}>
                  {municipality}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Freguesia</label>
            <select
              value={selectedParish}
              onChange={(e) => setSelectedParish(e.target.value)}
              disabled={!selectedMunicipality || availableParishes.length === 0}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600] disabled:opacity-50"
            >
              <option value="">
                {availableParishes.length === 0 ? "Sem freguesias disponíveis" : "Selecione uma freguesia..."}
              </option>
              {availableParishes.map((parish) => (
                <option key={parish} value={parish}>
                  {parish}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#999]">Rua / Localização específica</label>
          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Ex: Rua das Flores, nº 123"
            className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
          />
        </div>
      </div>

      {/* Secção: Geolocalização */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Geolocalização</h3>
        <p className="text-xs text-[#666]">
          Opcional: Para exibir mapa no site. Use Google Maps para obter coordenadas exatas.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-[#999]">Latitude</label>
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="39.7492"
              type="text"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Longitude</label>
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-8.8076"
              type="text"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
        </div>
      </div>

      {/* Secção: Estado e Certificação */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Estado e Certificação</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-[#999]">Estado</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            >
              <option value="">Selecione...</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Certificado Energético</label>
            <select
              value={energyCertificate}
              onChange={(e) => setEnergyCertificate(e.target.value)}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            >
              <option value="">Selecione...</option>
              {ENERGY_CERTIFICATES.map((cert) => (
                <option key={cert} value={cert}>{cert}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Secção: Visibilidade no Site */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Visibilidade no Site</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-600 bg-neutral-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
            />
            <label htmlFor="isPublished" className="text-sm text-white cursor-pointer">
              📢 Publicar no site (visível para clientes)
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-600 bg-neutral-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
            />
            <label htmlFor="isFeatured" className="text-sm text-white cursor-pointer">
              ⭐ {itemLabel} em Destaque (aparece na home)
            </label>
          </div>
        </div>
        <p className="text-xs text-[#666]">
          {!isPublished && `⚠️ Este ${itemLabelLower} ficará apenas em rascunho e não será exibido no site.`}
          {isPublished && !isFeatured && `✅ Este ${itemLabelLower} será publicado normalmente nas listagens.`}
          {isPublished && isFeatured && `🌟 Este ${itemLabelLower} será publicado E destacado na página inicial!`}
        </p>
      </div>

      {/* Secção: Descrição */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Descrição</h3>
        <div>
          <label className="mb-1 block text-xs text-[#999]">Descrição Pública</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Descrição detalhada do ${itemLabelLower} para o site...`}
            rows={4}
            className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-[#999]">Observações Internas</label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Notas internas, não visíveis no site..."
            rows={3}
            className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
          />
        </div>
      </div>

      {/* Secção: Vídeo Promocional */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">
          Vídeo Promocional
        </h3>
        
        <div className="space-y-3">
          {/* Upload de vídeo */}
          <div>
            <label className="mb-1 block text-xs text-[#999]">
              Upload de Vídeo (MP4, WebM, MOV)
              <span className="ml-2 text-green-500">✨ Compressão automática</span>
            </label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setVideoFile(file);
                  setVideoPreview(URL.createObjectURL(file));
                  setVideoUrl(''); // Limpar URL se estava definido
                }
              }}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600] file:mr-4 file:rounded file:border-0 file:bg-[#E10600] file:px-3 file:py-1 file:text-xs file:text-white hover:file:bg-[#c10500]"
            />
            <p className="mt-1 text-xs text-[#666]">
              💡 O vídeo será automaticamente comprimido para otimizar o carregamento
            </p>
          </div>

          {/* OU URL de vídeo */}
          <div>
            <label className="mb-1 block text-xs text-[#999]">
              OU URL de Vídeo (ex: YouTube, Vimeo, CDN)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                if (e.target.value) {
                  setVideoFile(null);
                  setVideoPreview(null);
                }
              }}
              placeholder="https://exemplo.com/video.mp4"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>

          {/* Preview do vídeo */}
          {(videoPreview || (videoUrl && (initial as any)?.video_url)) && (
            <div className="rounded-lg border border-[#1F1F22] bg-[#0F0F10] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-white">
                  {videoPreview ? '🎬 Novo Vídeo' : '📹 Vídeo Atual'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview(null);
                    setVideoUrl('');
                  }}
                  className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                >
                  🗑️ Remover
                </button>
              </div>
              <video
                src={videoPreview || videoUrl}
                controls
                className="w-full max-w-2xl rounded-lg"
                style={{ maxHeight: '300px' }}
              >
                Seu navegador não suporta vídeos.
              </video>
              {videoFile && (
                <p className="mt-2 text-xs text-[#888]">
                  Tamanho: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Secção: Imagens */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Imagens *</h3>
        <p className="text-xs text-yellow-400">
          ⚠️ <strong>Obrigatório:</strong> Adicione pelo menos 1 foto do {itemLabelLower}. Sem imagens, o {itemLabelLower} não aparece corretamente nas galerias do site.
        </p>
        <UploadArea
          existingUrls={existingImages}
          files={newFiles}
          onAddFiles={handleAddFiles}
          onRemoveFile={(idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
          onRemoveExisting={(idx) => setExistingImages((prev) => prev.filter((_, i) => i !== idx))}
          onMoveFile={(from, to) => setNewFiles((prev) => moveArrayItem(prev, from, to))}
          onMoveExisting={(from, to) => setExistingImages((prev) => moveArrayItem(prev, from, to))}
        />
      </div>

      {errors.length > 0 && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-3">
          <p className="mb-2 text-xs font-semibold text-red-400">Erros de validação:</p>
          <ul className="list-disc space-y-1 pl-4 text-xs text-red-400">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-[#E10600] to-[#a10600] px-4 py-3 text-sm font-semibold uppercase tracking-wide shadow-[0_0_12px_rgba(225,6,0,0.6)] transition hover:shadow-[0_0_20px_rgba(225,6,0,0.8)] disabled:opacity-60"
      >
        {loading ? "A guardar..." : `Guardar ${itemLabel}`}
      </button>
    </form>
  );
}

export default PropertyForm;
