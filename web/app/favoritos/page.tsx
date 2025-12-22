"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getPlaceholderImage } from "../../src/utils/placeholders";

interface FavoriteProperty {
  reference: string;
  title: string;
  price: number;
  location: string;
  image: string;
  addedAt: string;
  listName?: string;
}

interface FavoriteList {
  name: string;
  properties: FavoriteProperty[];
}

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [customLists, setCustomLists] = useState<FavoriteList[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadFavorites();
    
    const handleFavoritesChange = () => loadFavorites();
    window.addEventListener("favoritesChange", handleFavoritesChange);
    return () => window.removeEventListener("favoritesChange", handleFavoritesChange);
  }, []);

  const loadFavorites = () => {
    const stored = localStorage.getItem("favorites");
    if (stored) {
      const favs: FavoriteProperty[] = JSON.parse(stored);
      setFavorites(favs);
      
      // Group by lists
      const listsMap = new Map<string, FavoriteProperty[]>();
      favs.forEach(fav => {
        const listName = fav.listName || "Favoritos";
        if (!listsMap.has(listName)) {
          listsMap.set(listName, []);
        }
        listsMap.get(listName)!.push(fav);
      });
      
      const lists: FavoriteList[] = [];
      listsMap.forEach((properties, name) => {
        lists.push({ name, properties });
      });
      setCustomLists(lists);
    }
  };

  const removeFavorite = (reference: string) => {
    const updated = favorites.filter(f => f.reference !== reference);
    localStorage.setItem("favorites", JSON.stringify(updated));
    setFavorites(updated);
    loadFavorites();
    window.dispatchEvent(new Event("favoritesChange"));
  };

  const clearAllFavorites = () => {
    if (confirm("Tem a certeza que deseja remover todos os favoritos?")) {
      localStorage.removeItem("favorites");
      setFavorites([]);
      setCustomLists([]);
      window.dispatchEvent(new Event("favoritesChange"));
    }
  };

  if (!isClient) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E10600] border-t-transparent"></div>
      </div>
    );
  }

  const displayFavorites = activeTab === "all" 
    ? favorites 
    : customLists.find(l => l.name === activeTab)?.properties || [];

  const resolveImage = (property: FavoriteProperty) =>
    property.image || getPlaceholderImage(property.reference || property.title);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Os Meus Favoritos</h1>
          <p className="text-[#7A7A7A]">
            {favorites.length} {favorites.length === 1 ? "imóvel guardado" : "imóveis guardados"}
          </p>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={clearAllFavorites}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpar todos
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-[#2A2A2E] bg-[#1A1A1E]/50 py-16">
          <div className="rounded-full bg-[#E10600]/10 p-6">
            <svg className="h-12 w-12 text-[#E10600]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Ainda não tem favoritos</h2>
            <p className="mt-2 text-[#7A7A7A]">
              Explore os nossos imóveis e guarde os que mais gostar!
            </p>
          </div>
          <Link
            href="/imoveis"
            className="rounded-full bg-[#E10600] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#C10500]"
          >
            Explorar imóveis
          </Link>
        </div>
      ) : (
        <>
          {/* Tabs for lists */}
          {customLists.length > 1 && (
            <div className="flex flex-wrap gap-2 border-b border-[#2A2A2E] pb-4">
              <button
                onClick={() => setActiveTab("all")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === "all"
                    ? "bg-[#E10600] text-white"
                    : "bg-[#1A1A1E] text-[#C5C5C5] hover:text-white"
                }`}
              >
                Todos ({favorites.length})
              </button>
              {customLists.map(list => (
                <button
                  key={list.name}
                  onClick={() => setActiveTab(list.name)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeTab === list.name
                      ? "bg-[#E10600] text-white"
                      : "bg-[#1A1A1E] text-[#C5C5C5] hover:text-white"
                  }`}
                >
                  {list.name} ({list.properties.length})
                </button>
              ))}
            </div>
          )}

          {/* Properties Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayFavorites.map((property) => (
              <div
                key={property.reference}
                className="group relative overflow-hidden rounded-2xl border border-[#2A2A2E] bg-[#1A1A1E] transition hover:border-[#E10600]/30"
              >
                <Link href={`/imovel/${encodeURIComponent(property.reference)}`}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={resolveImage(property)}
                      alt={property.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  onClick={() => removeFavorite(property.reference)}
                  className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur transition hover:bg-red-500"
                  title="Remover dos favoritos"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>

                {/* List badge */}
                {property.listName && property.listName !== "Favoritos" && (
                  <span className="absolute left-3 top-3 rounded-full bg-[#E10600]/90 px-3 py-1 text-xs font-medium text-white">
                    {property.listName}
                  </span>
                )}

                <div className="p-4">
                  <Link href={`/imovel/${encodeURIComponent(property.reference)}`}>
                    <h3 className="font-semibold text-white transition hover:text-[#E10600]">
                      {property.title}
                    </h3>
                  </Link>
                  <p className="mt-1 text-sm text-[#7A7A7A]">{property.location}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-[#E10600]">
                      {property.price > 0
                        ? property.price.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
                        : "Sob consulta"}
                    </span>
                    <span className="text-xs text-[#7A7A7A]">
                      Adicionado em {new Date(property.addedAt).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
