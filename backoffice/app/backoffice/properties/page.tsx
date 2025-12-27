'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { DataTable } from "../../../backoffice/components/DataTable";
import { Drawer } from "../../../backoffice/components/Drawer";
import { PropertyForm, PropertyFormSubmit } from "@/backoffice/components/PropertyForm";
import { ToastProvider, useToast } from "../../../backoffice/components/ToastProvider";
import { EllipsisVerticalIcon, MapPinIcon, HomeIcon, CurrencyEuroIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  BackofficeProperty,
  BackofficePropertyPayload,
  createBackofficeProperty,
  deleteBackofficeProperty,
  getBackofficeProperties,
  updateBackofficeProperty,
  uploadPropertyVideo,
} from "@/src/services/backofficeApi";

export default function ImoveisBackofficePage() {
  return (
    <ToastProvider>
      <ImoveisInner />
    </ToastProvider>
  );
}

function ImoveisInner() {
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState<BackofficeProperty[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "AVAILABLE" | "RESERVED" | "SOLD">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  useEffect(() => {
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    if (activeMenu !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenu]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const data = await getBackofficeProperties({
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setItems(data);
    } catch (err: any) {
      toast.push(err?.message || "Erro ao carregar imóveis", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const matchesSearch =
        !search ||
        (p.reference || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.location || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const current = editingId ? items.find((i) => i.id === editingId) : undefined;

  const handleSubmit = async ({ payload, files, imagesToKeep, videoFile }: PropertyFormSubmit) => {
    setSaving(true);
    try {
      let propertyId: number;
      
      if (mode === "create") {
        const created = await createBackofficeProperty(payload, files);
        propertyId = created.id;
        toast.push("Imóvel criado", "success");
      } else if (editingId) {
        await updateBackofficeProperty(editingId, payload, files, imagesToKeep);
        propertyId = editingId;
        toast.push("Imóvel atualizado", "success");
      } else {
        return;
      }
      
      // Upload de vídeo se houver
      if (videoFile) {
        try {
          toast.push("🎬 Comprimindo e enviando vídeo...", "info");
          const result = await uploadPropertyVideo(propertyId, videoFile);
          
          // Mostrar info de compressão se disponível
          if (result.message) {
            toast.push(result.message, "success");
          } else {
            toast.push("Vídeo enviado com sucesso", "success");
          }
        } catch (err: any) {
          toast.push(`Vídeo não enviado: ${err.message}`, "error");
        }
      }
      
      await loadProperties();
      setDrawerOpen(false);
      setEditingId(null);
    } catch (err: any) {
      toast.push(err?.message || "Erro ao guardar imóvel", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar imóvel?")) return;
    try {
      await deleteBackofficeProperty(id);
      toast.push("Imóvel eliminado", "success");
      await loadProperties();
    } catch (err: any) {
      toast.push(err?.message || "Erro ao eliminar", "error");
    }
  };

  const handleDuplicate = async (property: BackofficeProperty) => {
    const newReference = `${property.reference}-copy-${Date.now()}`;
    const payload: BackofficePropertyPayload = {
      reference: newReference,
      title: property.title || newReference,
      business_type: property.business_type,
      property_type: property.property_type,
      typology: property.typology,
      description: property.description,
      observations: property.observations,
      price: property.price ?? 0,
      usable_area: property.usable_area,
      land_area: property.land_area,
      location: property.location,
      municipality: property.municipality,
      parish: property.parish,
      condition: property.condition,
      energy_certificate: property.energy_certificate,
      status: property.status || "AVAILABLE",
      agent_id: property.agent_id,
      images: property.images || [],
    };
    try {
      await createBackofficeProperty(payload);
      toast.push("Imóvel duplicado", "success");
      await loadProperties();
    } catch (err: any) {
      toast.push(err?.message || "Erro ao duplicar", "error");
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
  };

  return (
    <BackofficeLayout title="Imóveis">
      {/* Botão Voltar - Mobile */}
      <button
        onClick={() => router.push('/backoffice/dashboard')}
        className="md:hidden flex items-center gap-2 mb-4 text-sm text-[#C5C5C5] hover:text-white transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Voltar ao Dashboard</span>
      </button>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar"
          className="w-full sm:max-w-xs rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#E10600]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="all">Todos</option>
          <option value="AVAILABLE">Disponível</option>
          <option value="RESERVED">Reservado</option>
          <option value="SOLD">Vendido</option>
        </select>
        <button
          onClick={() => {
            setMode("create");
            setEditingId(null);
            setDrawerOpen(true);
          }}
          className="rounded bg-[#E10600] hover:bg-[#C10500] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors"
        >
          + Novo Imóvel
        </button>
      </div>

      {loading && <p className="text-sm text-[#C5C5C5]">A carregar imóveis...</p>}

      <section className="space-y-3">
        <h2 className="text-base sm:text-xl font-semibold text-white">Imóveis</h2>
        
        {/* Desktop/Tablet: Tabela completa */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-[#1F1F22] bg-[#0F0F10]">
          <DataTable
            dense
            columns={["Referência", "Foto", "Negócio", "Tipo", "Tipologia", "Preço", "Quartos", "Estado", "Área útil", "Área terreno"]}
            rows={filtered.map((p) => [
              p.reference || "—",
              // Foto de capa (primeira imagem)
              p.images && p.images.length > 0 ? (
                <img 
                  src={p.images[0]} 
                  alt="Capa" 
                  className="w-12 h-9 object-cover rounded"
                />
              ) : (
                <span className="inline-flex items-center justify-center w-12 h-9 bg-[#1F1F22] rounded text-[#666] text-xs">
                  📷
                </span>
              ),
              p.business_type || "—",
              p.property_type || "—",
              p.typology || "—",
              formatCurrency(p.price),
              p.typology?.replace(/\D/g, "") || "—",
              p.condition || "—",
              p.usable_area ? `${p.usable_area.toLocaleString("pt-PT")} m²` : "—",
              p.land_area ? `${p.land_area.toLocaleString("pt-PT")} m²` : "—",
            ])}
            actions={["Ver", "Editar", "Duplicar", "Eliminar"]}
            onAction={(action, idx) => {
              const property = filtered[idx];
              if (!property) return;
              if (action === "Ver" || action === "Editar") {
                setMode("edit");
                setEditingId(property.id);
                setDrawerOpen(true);
              }
              if (action === "Duplicar") handleDuplicate(property);
              if (action === "Eliminar") handleDelete(property.id);
            }}
          />
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-3">
          {filtered.map((property, idx) => (
            <div key={property.id} className="relative rounded-xl border border-[#1F1F22] bg-[#0F0F10] overflow-hidden">
              {/* Foto de Capa */}
              {property.images && property.images.length > 0 ? (
                <img 
                  src={property.images[0]} 
                  alt={property.reference || 'Imóvel'}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-[#1F1F22] flex items-center justify-center text-3xl text-[#444]">
                  🏠
                </div>
              )}
              
              <div className="p-3">
                {/* Header com Referência e Menu */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{property.reference || "—"}</h3>
                    <p className="text-xs text-[#C5C5C5] truncate">{property.title || property.location || "—"}</p>
                  </div>
                  <div className="relative ml-2">
                    <button
                      onClick={() => setActiveMenu(activeMenu === idx ? null : idx)}
                      className="p-1.5 rounded-lg hover:bg-[#1F1F22] transition-colors"
                    >
                      <EllipsisVerticalIcon className="w-5 h-5 text-[#C5C5C5]" />
                    </button>
                  {activeMenu === idx && (
                    <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-[#1F1F22] bg-[#0B0B0D] shadow-xl">
                      <button
                        onClick={() => {
                          setMode("edit");
                          setEditingId(property.id);
                          setDrawerOpen(true);
                          setActiveMenu(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#1F1F22] rounded-t-lg"
                      >
                        Ver/Editar
                      </button>
                      <button
                        onClick={() => {
                          handleDuplicate(property);
                          setActiveMenu(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-white hover:bg-[#1F1F22]"
                      >
                        Duplicar
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(property.id);
                          setActiveMenu(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-[#E10600] hover:bg-[#1F1F22] rounded-b-lg"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <HomeIcon className="w-4 h-4 text-[#E10600]" />
                  <div>
                    <p className="text-[#888] text-[10px] uppercase">Tipo</p>
                    <p className="text-white font-medium truncate">{property.property_type || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <CurrencyEuroIcon className="w-4 h-4 text-[#E10600]" />
                  <div>
                    <p className="text-[#888] text-[10px] uppercase">Preço</p>
                    <p className="text-white font-medium truncate">{formatCurrency(property.price)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[#888] text-[10px] uppercase">Tipologia</p>
                  <p className="text-white font-medium">{property.typology || "—"}</p>
                </div>
                <div>
                  <p className="text-[#888] text-[10px] uppercase">Negócio</p>
                  <p className="text-white font-medium truncate">{property.business_type || "—"}</p>
                </div>
                <div>
                  <p className="text-[#888] text-[10px] uppercase">Área Útil</p>
                  <p className="text-white font-medium">{property.usable_area ? `${property.usable_area.toLocaleString("pt-PT")} m²` : "—"}</p>
                </div>
                <div>
                  <p className="text-[#888] text-[10px] uppercase">Estado</p>
                  <p className="text-white font-medium truncate">{property.condition || "—"}</p>
                </div>
              </div>

              {/* Status Badge */}
              {property.status && (
                <div className="mt-2 inline-block">
                  <span className={`px-2 py-1 rounded text-[10px] font-semibold ${
                    property.status === 'AVAILABLE' ? 'bg-green-500/20 text-green-400' :
                    property.status === 'RESERVED' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {property.status === 'AVAILABLE' ? 'Disponível' :
                     property.status === 'RESERVED' ? 'Reservado' : 'Vendido'}
                  </span>
                </div>
              )}
              </div>{/* Fecha div p-3 */}
            </div>
          ))}
        </div>
      </section>

      <Drawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingId(null);
        }}
        title={mode === "create" ? "Novo Imóvel" : `Editar imóvel ${current?.reference || current?.title || ""}`}
      >
        <PropertyForm initial={mode === "edit" ? current : undefined} onSubmit={handleSubmit} loading={saving} />
      </Drawer>
    </BackofficeLayout>
  );
}
