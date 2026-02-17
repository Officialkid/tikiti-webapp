'use client';

import { useState } from 'react';
import { toast } from 'sonner';

const KEY = 'tikiti_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const s = localStorage.getItem(KEY);
      return s ? JSON.parse(s) : [];
    } catch {
      localStorage.removeItem(KEY);
      return [];
    }
  });

  const toggleFavorite = (eventId: string) => {
    setFavorites((prev) => {
      const isRemoving = prev.includes(eventId);
      const updated = isRemoving
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId];
      localStorage.setItem(KEY, JSON.stringify(updated));
      
      if (isRemoving) {
        toast.info('Removed from favorites');
      } else {
        toast.success('Saved to favorites ❤️');
      }
      
      return updated;
    });
  };

  const isFavorited = (eventId: string) => favorites.includes(eventId);
  return { favorites, toggleFavorite, isFavorited };
}
