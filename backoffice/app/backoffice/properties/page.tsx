'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { PlusIcon, HomeIcon, PencilSquareIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useTerminology } from "@/context/TerminologyContext";

type Property = {
  id: number;
  reference: string;
  title: string;
  business_type?: string;
  property_type?: string;
  typology?: string;
  price?: number;
  location?: string;
  municipality?: string;
  status?: string;
  images?: string[];
  created_at?: string;
};

const statusLabels: Record<string, string> = {
  available: 'Disponível',
  AVAILABLE: 'Disponível',
  reserved: 'Reservado',
  RESERVED: 'Reservado',
  sold: 'Vendido',
  SOLD: 'Vendido',
  rented: 'Arrendado',
  RENTED: 'Arrendado',
  inactive: 'Inativo',
  INACTIVE: 'Inativo',
};

const statusColors: Record<string, string> = {
  available: 'bg-green-500/20 text-green-400',
  AVAILABLE: 'bg-green-500/20 text-green-400',
  reserved: 'bg-yellow-500/20 text-yellow-400',
  RESERVED: 'bg-yellow-500/20 text-yellow-400',
  sold: 'bg-blue-500/20 text-blue-400',
  SOLD: 'bg-blue-500/20 text-blue-400',
  rented: 'bg-purple-500/20 text-purple-400',
  RENTED: 'bg-purple-500/20 text-purple-400',
  inactive: 'bg-gray-500/20 text-gray-400',
  INACTIVE: 'bg-gray-500/20 text-gray-400',
};

const ITEMS_PER_PAGE = 24;

export default function PropertiesPage() {
  const router = useRouter();
  const { term } = useTerminology();
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);

  // Terminologia dinâmica
  const propertiesLabel = term('properties', 'Imóveis');
  const propertyLabel = term('property_singular', 'Imóvel');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties?limit=1000', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setAllProperties(Array.isArray(data) ? data : data.items || []);
        }
      } catch (error) {
        console.error(`Erro ao carregar ${propertiesLabel.toLowerCase()}:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [propertiesLabel]);

  // Filtragem client-side
  const filteredProperties = useMemo(() => {
    return allProperties.filter(property => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          property.reference?.toLowerCase().includes(searchLower) ||
          property.title?.toLowerCase().includes(searchLower) ||
          property.location?.toLowerCase().includes(searchLower) ||
          property.municipality?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (statusFilter && property.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (businessTypeFilter && property.business_type?.toLowerCase() !== businessTypeFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [allProperties, search, statusFilter, businessTypeFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProperties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProperties, currentPage]);

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, businessTypeFilter]);

  // Valores únicos para filtros dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(allProperties.map(p => p.status).filter(Boolean));
    return Array.from(statuses) as string[];
  }, [allProperties]);

  const uniqueBusinessTypes = useMemo(() => {
    const types = new Set(allProperties.map(p => p.business_type).filter(Boolean));
    return Array.from(types) as string[];
  }, [allProperties]);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <BackofficeLayout title={propertiesLabel}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{propertiesLabel}</h1>
          <p className="text-sm text-[#999]">
            {filteredProperties.length} de {allProperties.length} {propertiesLabel.toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => router.push("/backoffice/properties/new")}
          className="flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#c00500]"
        >
          <PlusIcon className="h-4 w-4" />
          Novo {propertyLabel}
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#23232B] bg-[#0F0F12] p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#666]" />
          <input
            type="text"
            placeholder="Pesquisar por referência, título ou localização..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#23232B] bg-[#1A1A1F] py-2 pl-10 pr-4 text-sm text-white placeholder-[#666] outline-none focus:border-[#E10600]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[#23232B] bg-[#1A1A1F] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]/50"
        >
          <option value="">Todos os estados</option>
          {uniqueStatuses.map(status => (
            <option key={status} value={status}>{statusLabels[status] || status}</option>
          ))}
        </select>
        <select
          value={businessTypeFilter}
          onChange={(e) => setBusinessTypeFilter(e.target.value)}
          className="rounded-lg border border-[#23232B] bg-[#1A1A1F] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]/50"
        >
          <option value="">Todos os tipos</option>
          {uniqueBusinessTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {(search || statusFilter || businessTypeFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setBusinessTypeFilter(''); }}
            className="text-sm text-[#E10600] hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar {propertiesLabel.toLowerCase()}...</div>
      ) : paginatedProperties.length === 0 ? (
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <HomeIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">
            {(search || statusFilter || businessTypeFilter) 
              ? `Nenhum ${propertyLabel.toLowerCase()} encontrado com os filtros aplicados`
              : `Nenhum ${propertyLabel.toLowerCase()} encontrado`}
          </p>
          {!(search || statusFilter || businessTypeFilter) && (
            <button
              onClick={() => router.push("/backoffice/properties/new")}
              className="mt-4 text-sm text-[#E10600] hover:underline"
            >
              Adicionar primeiro {propertyLabel.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedProperties.map((property) => (
            <div
              key={property.id}
              onClick={() => router.push(`/backoffice/properties/${property.id}`)}
              className="cursor-pointer overflow-hidden rounded-xl border border-[#23232B] bg-[#0F0F12] transition-all hover:border-[#E10600]/30 hover:bg-[#151518]"
            >
              {/* Image */}
              <div className="aspect-video w-full bg-[#1A1A1F]">
                {property.images && property.images[0] ? (
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <HomeIcon className="h-12 w-12 text-[#333]" />
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#666]">{property.reference}</p>
                    <h3 className="mt-1 truncate font-medium text-white">{property.title}</h3>
                    <p className="mt-1 text-sm text-[#999]">
                      {[property.typology, property.municipality].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/backoffice/properties/${property.id}/editar`);
                    }}
                    className="ml-2 rounded-lg p-2 text-[#999] transition-colors hover:bg-[#1F1F22] hover:text-white"
                    title="Editar"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">
                    {formatCurrency(property.price)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[property.status || 'available'] || statusColors.available}`}>
                    {statusLabels[property.status || 'available'] || property.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg border border-[#23232B] bg-[#0F0F12] px-3 py-2 text-sm text-white transition-colors hover:bg-[#1A1A1F] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Anterior
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <span key={page} className="flex items-center">
                    {idx > 0 && page - arr[idx - 1] > 1 && <span className="px-2 text-[#666]">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[36px] rounded-lg px-3 py-2 text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-[#E10600] text-white'
                          : 'border border-[#23232B] bg-[#0F0F12] text-white hover:bg-[#1A1A1F]'
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-lg border border-[#23232B] bg-[#0F0F12] px-3 py-2 text-sm text-white transition-colors hover:bg-[#1A1A1F] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Seguinte
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-[#666]">
          Página {currentPage} de {totalPages} • {ITEMS_PER_PAGE} {propertiesLabel.toLowerCase()} por página
        </p>
        </>
      )}
    </BackofficeLayout>
  );
}
