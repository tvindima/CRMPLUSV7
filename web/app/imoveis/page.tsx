'use client';

import Link from "next/link";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getProperties, Property } from "../../src/services/publicApi";
import { SafeImage } from "../../components/SafeImage";
import { getPropertyCover } from "../../src/utils/placeholders";

const ITEMS_PER_PAGE = 12;

function ImoveisContent() {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // URL params
  const agentIdParam = searchParams.get('agent_id');
  const teamParam = searchParams.get('team');
  const tipoParam = searchParams.get('tipo');
  const negocioParam = searchParams.get('negocio');
  
  // Filtros
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>(tipoParam || "");
  const [filterBusiness, setFilterBusiness] = useState<string>(negocioParam || "");
  const [filterTypology, setFilterTypology] = useState<string>("");
  const [filterMunicipality, setFilterMunicipality] = useState<string>("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [showReservedSold, setShowReservedSold] = useState<boolean>(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);

  // Reset para página 1 quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType, filterBusiness, filterTypology, filterMunicipality, priceMin, priceMax, showReservedSold]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProperties(500);
        setProperties(data);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar imóveis");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      // Filtro por agente específico
      if (agentIdParam && p.agent_id !== parseInt(agentIdParam)) {
        return false;
      }
      
      // Filtro por equipa (lista de IDs separados por vírgula)
      if (teamParam) {
        const teamIds = teamParam.split(',').map(id => parseInt(id.trim()));
        if (!teamIds.includes(p.agent_id ?? 0)) {
          return false;
        }
      }
      
      const matchesSearch =
        !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.location?.toLowerCase().includes(search.toLowerCase()) ||
        p.municipality?.toLowerCase().includes(search.toLowerCase()) ||
        p.reference?.toLowerCase().includes(search.toLowerCase());
      
      const matchesType = !filterType || p.property_type?.toLowerCase().includes(filterType.toLowerCase());
      const matchesBusiness = !filterBusiness || p.business_type?.toLowerCase().includes(filterBusiness.toLowerCase());
      const matchesTypology = !filterTypology || p.typology === filterTypology;
      const matchesMunicipality = !filterMunicipality || p.municipality === filterMunicipality;
      
      const min = priceMin ? parseFloat(priceMin) : 0;
      const max = priceMax ? parseFloat(priceMax) : Infinity;
      const matchesPrice = !p.price || (p.price >= min && p.price <= max);
      
      // Filtrar propriedades reservadas/vendidas (a menos que o usuário queira vê-las)
      const matchesStatus = showReservedSold || 
        (p.status?.toUpperCase() !== 'RESERVED' && p.status?.toUpperCase() !== 'SOLD');
      
      return matchesSearch && matchesType && matchesBusiness && matchesTypology && matchesMunicipality && matchesPrice && matchesStatus;
    });
  }, [properties, search, filterType, filterBusiness, filterTypology, filterMunicipality, priceMin, priceMax, showReservedSold, agentIdParam, teamParam]);

  // Paginação
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const propertyTypes = Array.from(new Set(properties.map(p => p.property_type).filter(Boolean)));
  const businessTypes = Array.from(new Set(properties.map(p => p.business_type).filter(Boolean)));
  const typologies = Array.from(new Set(properties.map(p => p.typology).filter(Boolean))).sort();
  const municipalities = Array.from(new Set(properties.map(p => p.municipality).filter(Boolean))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-[#E10600]">Portefólio</p>
          <h1 className="text-xl font-semibold md:text-3xl">Imóveis em destaque</h1>
          <p className="text-sm text-[#C5C5C5]">Explora a montra visual ao estilo catálogo Netflix.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por referência ou localização"
          className="w-full max-w-sm rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <label className="flex items-center gap-2 rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white cursor-pointer hover:border-[#E10600] transition">
          <input
            type="checkbox"
            checked={showReservedSold}
            onChange={(e) => setShowReservedSold(e.target.checked)}
            className="h-4 w-4 accent-[#E10600]"
          />
          <span>Mostrar Reservados/Vendidos</span>
        </label>
        <select
          value={filterBusiness}
          onChange={(e) => setFilterBusiness(e.target.value)}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="">Compra / Arrendamento</option>
          {businessTypes.map(type => (
            <option key={type} value={type || ''}>{type}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="">Todos os tipos</option>
          {propertyTypes.map(type => (
            <option key={type} value={type || ''}>{type}</option>
          ))}
        </select>
        <select
          value={filterTypology}
          onChange={(e) => setFilterTypology(e.target.value)}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="">Todas tipologias</option>
          {typologies.map(typ => (
            <option key={typ} value={typ || ''}>{typ}</option>
          ))}
        </select>
        <select
          value={filterMunicipality}
          onChange={(e) => setFilterMunicipality(e.target.value)}
          className="rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        >
          <option value="">Todos concelhos</option>
          {municipalities.map(mun => (
            <option key={mun} value={mun || ''}>{mun}</option>
          ))}
        </select>
        <input
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          type="number"
          placeholder="Preço mín"
          className="w-32 rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
        <input
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          type="number"
          placeholder="Preço máx"
          className="w-32 rounded border border-[#2A2A2E] bg-[#151518] px-3 py-2 text-sm text-white outline-none focus:border-[#E10600]"
        />
      </div>

      <div className="flex items-center justify-between text-sm text-[#C5C5C5]">
        <p>{filtered.length} imóveis encontrados</p>
        {totalPages > 1 && <p>Página {currentPage} de {totalPages}</p>}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2A2A2E] border-t-[#E10600]"></div>
          <p className="text-sm text-[#C5C5C5]">A carregar imóveis…</p>
        </div>
      )}
      
      {error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-900/30 bg-red-950/20 p-8">
          <div className="text-4xl">⚠️</div>
          <div className="text-center">
            <p className="text-lg font-semibold text-red-400">Erro ao carregar imóveis</p>
            <p className="text-sm text-red-300/70">{error}</p>
            <p className="mt-2 text-xs text-[#C5C5C5]">Verifique a sua ligação à internet</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#E10600] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#C10500]"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedProperties.map((p) => (
              <Link
                href={`/imovel/${encodeURIComponent(p.reference || p.title || "")}`}
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-[#1F1F22] bg-[#0F0F10] shadow-lg shadow-[#E10600]/10 transition hover:-translate-y-1 hover:shadow-[#E10600]/25"
              >
              <div className="relative h-48 w-full overflow-hidden">
                <SafeImage
                  src={getPropertyCover(p)}
                  alt={p.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  {p.typology && (
                    <span className="rounded-full bg-[#E10600]/90 px-3 py-1 text-xs font-semibold text-white">{p.typology}</span>
                  )}
                  <span className="rounded-full bg-black/70 px-3 py-1 text-xs text-white">{p.business_type || "—"}</span>
                </div>
                <div className="absolute right-3 top-3">
                  {p.status?.toUpperCase() === 'RESERVED' && (
                    <span className="rounded-full bg-yellow-600/90 px-3 py-1 text-xs font-bold text-white shadow-lg">RESERVADO</span>
                  )}
                  {p.status?.toUpperCase() === 'SOLD' && (
                    <span className="rounded-full bg-gray-700/90 px-3 py-1 text-xs font-bold text-white shadow-lg">VENDIDO</span>
                  )}
                </div>
              </div>
              <div className="space-y-2 p-4">
                {p.reference && (
                  <p className="text-xs font-mono font-semibold text-[#E10600] uppercase tracking-wider">
                    {p.reference}
                  </p>
                )}
                <h3 className="text-lg font-semibold text-white group-hover:text-[#E10600] transition">{p.title || "Imóvel"}</h3>
                <p className="text-sm text-[#C5C5C5]">
                  {p.location || [p.municipality, p.parish].filter(Boolean).join(", ") || "Localização não disponível"}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-white">
                  <span className="font-semibold">
                    {p.price ? `${p.price.toLocaleString("pt-PT")} €` : "Preço sob consulta"}
                  </span>
                  {p.usable_area && <span className="text-[#C5C5C5]">{p.usable_area} m²</span>}
                  {p.energy_certificate && <span className="text-[#C5C5C5]">CCE {p.energy_certificate}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded border border-[#2A2A2E] px-4 py-2 text-sm text-white transition hover:border-[#E10600] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 w-10 rounded text-sm font-semibold transition ${
                    page === currentPage
                      ? 'bg-[#E10600] text-white'
                      : 'border border-[#2A2A2E] text-[#C5C5C5] hover:border-[#E10600] hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-[#2A2A2E] px-4 py-2 text-sm text-white transition hover:border-[#E10600] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        )}
      </>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[#2A2A2E] bg-[#0F0F10] p-12">
          <div className="text-6xl opacity-30">🔍</div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">Nenhum imóvel encontrado</p>
            <p className="mt-2 text-sm text-[#C5C5C5]">
              Experimente ajustar os filtros ou limpar a pesquisa
            </p>
          </div>
          <button
            onClick={() => {
              setSearch("");
              setFilterType("");
              setFilterBusiness("");
              setFilterTypology("");
              setFilterMunicipality("");
              setPriceMin("");
              setPriceMax("");
            }}
            className="mt-2 rounded-lg border border-[#E10600] px-6 py-2 text-sm font-semibold text-[#E10600] transition hover:bg-[#E10600] hover:text-white"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

export default function ImoveisPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-white">A carregar imóveis...</div>}>
      <ImoveisContent />
    </Suspense>
  );
}
