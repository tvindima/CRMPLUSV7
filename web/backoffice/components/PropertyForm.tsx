'use client';

import { FormEvent, useEffect, useMemo, useState } from "react";
import { UploadArea } from "./UploadArea";
import { BackofficeProperty, BackofficePropertyPayload } from "../../src/services/backofficeApi";

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

const toNumber = (value: string): number | null => {
  if (!value) return null;
  const normalized = value.replace(",", ".").replace(/\s+/g, "");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

export function PropertyForm({ initial, onSubmit, loading }: Props) {
  const [reference, setReference] = useState(initial?.reference || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [businessType, setBusinessType] = useState(initial?.business_type || "");
  const [propertyType, setPropertyType] = useState(initial?.property_type || "");
  const [typology, setTypology] = useState(initial?.typology || "");
  const [price, setPrice] = useState<string>(initial?.price?.toString() || "");
  const [usableArea, setUsableArea] = useState<string>(initial?.usable_area?.toString() || "");
  const [landArea, setLandArea] = useState<string>(initial?.land_area?.toString() || "");
  const [municipality, setMunicipality] = useState(initial?.municipality || "");
  const [parish, setParish] = useState(initial?.parish || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [condition, setCondition] = useState(initial?.condition || "");
  const [energyCertificate, setEnergyCertificate] = useState(initial?.energy_certificate || "");
  const [status, setStatus] = useState(initial?.status || "available");
  const [agentId, setAgentId] = useState(initial?.agent_id?.toString() || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [observations, setObservations] = useState(initial?.observations || "");
  const [existingImages, setExistingImages] = useState<string[]>(initial?.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setReference(initial?.reference || "");
    setTitle(initial?.title || "");
    setBusinessType(initial?.business_type || "");
    setPropertyType(initial?.property_type || "");
    setTypology(initial?.typology || "");
    setPrice(initial?.price?.toString() || "");
    setUsableArea(initial?.usable_area?.toString() || "");
    setLandArea(initial?.land_area?.toString() || "");
    setMunicipality(initial?.municipality || "");
    setParish(initial?.parish || "");
    setLocation(initial?.location || "");
    setCondition(initial?.condition || "");
    setEnergyCertificate(initial?.energy_certificate || "");
    setStatus(initial?.status || "available");
    setAgentId(initial?.agent_id?.toString() || "");
    setDescription(initial?.description || "");
    setObservations(initial?.observations || "");
    setExistingImages(initial?.images || []);
    setNewFiles([]);
    setErrors([]);
  }, [initial]);

  const derivedLocation = useMemo(() => {
    if (location) return location;
    if (municipality || parish) return [municipality, parish].filter(Boolean).join(" / ");
    return "";
  }, [location, municipality, parish]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!reference) errs.push("Referência é obrigatória");
    if (!title && !reference) errs.push("Título é obrigatório");
    const priceNumber = toNumber(price);
    if (priceNumber === null) errs.push("Preço é obrigatório e deve ser numérico");
    const usableAreaNumber = toNumber(usableArea);
    const landAreaNumber = toNumber(landArea);
    const agentIdNumber = agentId ? Number(agentId) : null;
    if (agentId && Number.isNaN(agentIdNumber)) errs.push("ID de agente inválido");
    if (existingImages.length === 0 && newFiles.length === 0) errs.push("Pelo menos uma imagem é obrigatória");
    setErrors(errs);
    if (errs.length) return;

    const payload: BackofficePropertyPayload = {
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
      municipality: municipality || null,
      parish: parish || null,
      condition: condition || null,
      energy_certificate: energyCertificate || null,
      status: status || "available",
      agent_id: agentIdNumber,
      images: existingImages,
    };

    onSubmit({
      payload,
      files: newFiles,
      imagesToKeep: existingImages,
    });
  };

  const handleAddFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    setNewFiles((prev) => [...prev, ...Array.from(fileList)]);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Referência"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <input
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          placeholder="Negócio (ex.: Venda/Arrendamento)"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          placeholder="Tipo (Apartamento, Moradia, ...)"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          value={typology}
          onChange={(e) => setTypology(e.target.value)}
          placeholder="Tipologia (T2, T3...)"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preço (€)"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          value={usableArea}
          onChange={(e) => setUsableArea(e.target.value)}
          placeholder="Área útil (m²)"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          value={landArea}
          onChange={(e) => setLandArea(e.target.value)}
          placeholder="Área terreno (m²)"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <input
          value={municipality}
          onChange={(e) => setMunicipality(e.target.value)}
          placeholder="Concelho"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          value={parish}
          onChange={(e) => setParish(e.target.value)}
          placeholder="Freguesia"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Localização (override)"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <input
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="Estado (Novo/Usado/Em construção)"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          value={energyCertificate}
          onChange={(e) => setEnergyCertificate(e.target.value)}
          placeholder="Certificado energético (A, B, C...)"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="available">Disponível</option>
          <option value="reserved">Reservado</option>
          <option value="sold">Vendido</option>
        </select>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          placeholder="Agente (ID opcional)"
          className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição"
        rows={3}
        className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
      />
      <textarea
        value={observations}
        onChange={(e) => setObservations(e.target.value)}
        placeholder="Observações internas"
        rows={3}
        className="w-full rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
      />

      <UploadArea
        existingUrls={existingImages}
        files={newFiles}
        onAddFiles={handleAddFiles}
        onRemoveFile={(idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
        onRemoveExisting={(idx) => setExistingImages((prev) => prev.filter((_, i) => i !== idx))}
      />

      {errors.length > 0 && (
        <ul className="list-disc space-y-1 pl-4 text-xs text-red-400">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-gradient-to-r from-[#E10600] to-[#a10600] px-4 py-2 text-sm font-semibold shadow-[0_0_12px_rgba(225,6,0,0.6)] disabled:opacity-60"
      >
        {loading ? "A guardar..." : "Guardar"}
      </button>
    </form>
  );
}
