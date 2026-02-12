import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tikiti-favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tikiti-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (eventId: string) => {
    setFavorites((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const isFavorited = (eventId: string) => {
    return favorites.includes(eventId);
  };

  const addFavorite = (eventId: string) => {
    if (!favorites.includes(eventId)) {
      setFavorites((prev) => [...prev, eventId]);
    }
  };

  const removeFavorite = (eventId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== eventId));
  };

  return {
    favorites,
    toggleFavorite,
    isFavorited,
    addFavorite,
    removeFavorite,
  };
}
