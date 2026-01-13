'use client';

import { FormEvent, useEffect, useMemo, useState } from "react";
import { UploadArea } from "./UploadArea";
import { BackofficeProperty, BackofficePropertyPayload } from "@/src/services/backofficeApi";
import { DISTRICTS, MUNICIPALITIES, PARISHES, CONDITIONS, ENERGY_CERTIFICATES } from "@/src/data/portugal";
import { useTenant } from "@/context/TenantContext";
import { useTerminology } from "@/context/TerminologyContext";
import { getSectorConfig, shouldShowField } from "@/lib/sectorConfig";

export type PropertyFormSubmit = {
  payload: BackofficePropertyPayload;
  files: File[];
  imagesToKeep: string[];
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

// Opções estáticas para status
const STATUSES = [
  { value: "AVAILABLE", label: "Disponível" },
  { value: "RESERVED", label: "Reservado" },
  { value: "SOLD", label: "Vendido" },
  { value: "CANCELLED", label: "Cancelado" }
];

export function PropertyForm({ initial, onSubmit, loading }: Props) {
  // Contextos para terminologia dinâmica
  const { sector } = useTenant();
  const { term } = useTerminology();
  const sectorConfig = useMemo(() => getSectorConfig(sector), [sector]);
  
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
    if (!selectedAgentId) errs.push("Agente é obrigatório");
    if (!selectedDistrict) errs.push("Distrito é obrigatório");
    if (!selectedMunicipality) errs.push("Concelho é obrigatório");
    
    const priceNumber = toNumber(price);
    if (priceNumber === null) errs.push("Preço é obrigatório e deve ser numérico");
    
    const usableAreaNumber = toNumber(usableArea);
    const landAreaNumber = toNumber(landArea);
    const agentIdNumber = Number(selectedAgentId);
    
    if (existingImages.length === 0 && newFiles.length === 0) {
      errs.push("Pelo menos uma imagem é obrigatória");
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
    };

    onSubmit({
      payload,
      files: newFiles,
      imagesToKeep: existingImages,
    });
  };

  const handleAddFiles = (files: File[]) => {
    if (!files || files.length === 0) return;
    setNewFiles((prev) => [...prev, ...files]);
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
              placeholder={sectorConfig.placeholders.title}
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
              {sectorConfig.businessTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">{sectorConfig.labels.property_type} *</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            >
              <option value="">Selecione...</option>
              {sectorConfig.propertyTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          {sectorConfig.typologies.length > 0 && (
          <div>
            <label className="mb-1 block text-xs text-[#999]">{sectorConfig.labels.typology}</label>
            <select
              value={typology}
              onChange={(e) => setTypology(e.target.value)}
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            >
              <option value="">Selecione...</option>
              {sectorConfig.typologies.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          )}
        </div>
      </div>

      {/* Secção: Valores e Áreas */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Valores {sector === 'real_estate' ? 'e Áreas' : ''}</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-[#999]">Preço (€) *</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={sectorConfig.placeholders.price}
              type="text"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#999]">{sectorConfig.labels.area} ({sectorConfig.labels.area_unit})</label>
            <input
              value={usableArea}
              onChange={(e) => setUsableArea(e.target.value)}
              placeholder={sectorConfig.placeholders.area}
              type="text"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
          {shouldShowField(sector, 'area_land') && (
          <div>
            <label className="mb-1 block text-xs text-[#999]">{sectorConfig.labels.area_land || 'Área terreno'} ({sectorConfig.labels.area_unit})</label>
            <input
              value={landArea}
              onChange={(e) => setLandArea(e.target.value)}
              placeholder="500"
              type="text"
              className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
            />
          </div>
          )}
        </div>
      </div>

      {/* Secção: Características - Só para imobiliário/hospitality */}
      {shouldShowField(sector, 'bedrooms') && (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Características</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-[#999]">{sectorConfig.labels.bedrooms || 'Quartos'}</label>
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
            <label className="mb-1 block text-xs text-[#999]">{sectorConfig.labels.bathrooms || 'Casas de Banho'}</label>
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
      )}

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
              ⭐ {term('item')} em Destaque (aparece na home)
            </label>
          </div>
        </div>
        <p className="text-xs text-[#666]">
          {!isPublished && `⚠️ Este ${term('item_singular').toLowerCase()} ficará apenas em rascunho e não será exibido no site.`}
          {isPublished && !isFeatured && `✅ Este ${term('item_singular').toLowerCase()} será publicado normalmente nas listagens.`}
          {isPublished && isFeatured && `🌟 Este ${term('item_singular').toLowerCase()} será publicado E destacado na página inicial!`}
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
            placeholder={`Descrição detalhada do ${term('item_singular').toLowerCase()} para o site...`}
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

      {/* Secção: Imagens */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#888]">Imagens *</h3>
        <UploadArea
          existingUrls={existingImages}
          files={newFiles}
          onAddFiles={handleAddFiles}
          onRemoveFile={(idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
          onRemoveExisting={(idx) => setExistingImages((prev) => prev.filter((_, i) => i !== idx))}
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
        {loading ? "A guardar..." : `Guardar ${term('item')}`}
      </button>
    </form>
  );
}

export default PropertyForm;
