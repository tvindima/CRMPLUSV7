'use client';

import { useState, useEffect } from 'react';

type Props = {
  propertyId: number;
  propertyTitle: string;
};

export function FavoriteButton({ propertyId, propertyTitle }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [lists, setLists] = useState<string[]>(['Favoritos', 'Para visitar', 'Interessante']);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    // Load favorites from localStorage
    const favorites = JSON.parse(localStorage.getItem('property_favorites') || '[]');
    setIsFavorite(favorites.includes(propertyId));
    
    // Load custom lists
    const savedLists = JSON.parse(localStorage.getItem('property_lists') || '["Favoritos", "Para visitar", "Interessante"]');
    setLists(savedLists);
  }, [propertyId]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('property_favorites') || '[]');
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter((id: number) => id !== propertyId);
    } else {
      newFavorites = [...favorites, propertyId];
    }
    
    localStorage.setItem('property_favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const addToList = (listName: string) => {
    const listKey = `property_list_${listName.toLowerCase().replace(/\s+/g, '_')}`;
    const listItems = JSON.parse(localStorage.getItem(listKey) || '[]');
    
    if (!listItems.find((item: any) => item.id === propertyId)) {
      listItems.push({ id: propertyId, title: propertyTitle, addedAt: new Date().toISOString() });
      localStorage.setItem(listKey, JSON.stringify(listItems));
    }
    
    setShowListModal(false);
  };

  const createNewList = () => {
    if (newListName.trim()) {
      const newLists = [...lists, newListName.trim()];
      setLists(newLists);
      localStorage.setItem('property_lists', JSON.stringify(newLists));
      addToList(newListName.trim());
      setNewListName('');
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          onClick={toggleFavorite}
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition"
          style={{
            backgroundColor: isFavorite ? 'var(--color-primary)' : 'rgba(11, 11, 13, 0.7)',
            color: 'var(--color-text)',
            boxShadow: isFavorite ? 'none' : 'inset 0 0 0 1px var(--color-border)',
          }}
        >
          <svg
            className="h-5 w-5"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          {isFavorite ? 'Guardado' : 'Guardar'}
        </button>

        <button
          onClick={() => setShowListModal(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition"
          style={{
            backgroundColor: 'rgba(11, 11, 13, 0.7)',
            color: 'var(--color-text)',
            boxShadow: 'inset 0 0 0 1px var(--color-border)',
          }}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Adicionar a lista
        </button>
      </div>

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowListModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ backgroundColor: 'var(--color-background-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Adicionar a uma lista</h3>
              <button onClick={() => setShowListModal(false)} style={{ color: 'var(--color-text-muted)' }}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {lists.map((list) => (
                <button
                  key={list}
                  onClick={() => addToList(list)}
                  className="w-full rounded-lg p-3 text-left text-sm transition"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {list}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="mb-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>Criar nova lista</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Nome da lista"
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                />
                <button
                  onClick={createNewList}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
