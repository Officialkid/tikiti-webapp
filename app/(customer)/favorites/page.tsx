'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EventCard from '@/components/events/EventCard';
import EventCardSkeleton from '@/components/events/EventCardSkeleton';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { eventService } from '@/lib/services/eventService';
import { TikitiEvent } from '@/types/event';

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const [events, setEvents] = useState<TikitiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (favorites.length === 0) { setLoading(false); return; }
      const results = await Promise.all(favorites.map((id) => eventService.getEventById(id)));
      setEvents(results.filter(Boolean) as TikitiEvent[]);
      setLoading(false);
    };
    fetch();
  }, [favorites]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
          My Favorites ❤️
        </h1>
        <p className="text-gray-500 mb-8">
          {favorites.length} saved {favorites.length === 1 ? 'event' : 'events'}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <p className="text-7xl mb-6">💔</p>
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
              No favorites yet
            </h2>
            <p className="text-gray-500 mb-8">Tap the heart on any event to save it here</p>
            <button
              onClick={() => router.push('/events')}
              className="px-8 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
            >
              Discover Events
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event, i) => (
              <motion.div
                key={event.eventId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
