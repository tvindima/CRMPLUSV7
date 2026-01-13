'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import { PlusIcon, HomeIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
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
  reserved: 'Reservado',
  sold: 'Vendido',
  rented: 'Arrendado',
  inactive: 'Inativo',
};

const statusColors: Record<string, string> = {
  available: 'bg-green-500/20 text-green-400',
  reserved: 'bg-yellow-500/20 text-yellow-400',
  sold: 'bg-blue-500/20 text-blue-400',
  rented: 'bg-purple-500/20 text-purple-400',
  inactive: 'bg-gray-500/20 text-gray-400',
};

export default function PropertiesPage() {
  const router = useRouter();
  const { term } = useTerminology();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Terminologia dinâmica
  const propertiesLabel = term('properties', 'Imóveis');
  const propertyLabel = term('property_singular', 'Imóvel');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('/api/properties?limit=500', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          // API returns array directly or {items: []}
          setProperties(Array.isArray(data) ? data : data.items || []);
        }
      } catch (error) {
        console.error(`Erro ao carregar ${propertiesLabel.toLowerCase()}:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [propertiesLabel]);

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <BackofficeLayout title={propertiesLabel}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{propertiesLabel}</h1>
          <p className="text-sm text-[#999]">Gerir {propertiesLabel.toLowerCase()} da carteira</p>
        </div>
        <button
          onClick={() => router.push("/backoffice/properties/new")}
          className="flex items-center gap-2 rounded-lg bg-[#E10600] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#c00500]"
        >
          <PlusIcon className="h-4 w-4" />
          Novo {propertyLabel}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#999]">A carregar {propertiesLabel.toLowerCase()}...</div>
      ) : properties.length === 0 ? (
        <div className="rounded-xl border border-[#23232B] bg-[#0F0F12] p-12 text-center">
          <HomeIcon className="mx-auto h-12 w-12 text-[#555]" />
          <p className="mt-4 text-[#999]">Nenhum {propertyLabel.toLowerCase()} encontrado</p>
          <button
            onClick={() => router.push("/backoffice/properties/new")}
            className="mt-4 text-sm text-[#E10600] hover:underline"
          >
            Adicionar primeiro {propertyLabel.toLowerCase()}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
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
      )}
    </BackofficeLayout>
  );
}
