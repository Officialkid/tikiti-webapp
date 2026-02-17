'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import EventCard from '@/components/events/EventCard';
import EventFiltersBar from '@/components/events/EventFiltersBar';
import EventCardSkeleton from '@/components/events/EventCardSkeleton';
import { useEvents } from '@/lib/hooks/useEvents';
import { EventFilters } from '@/types/event';

export default function EventsPage() {
  const [filters, setFilters] = useState<EventFilters>({
    showPublicOnly: true, // Only show public events on browse page
  });

  const { events, loading, error, hasMore, loadMore } = useEvents(filters);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-500 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-black text-white mb-2">
            Upcoming Events
          </h1>
          <p className="text-white/80 text-lg">
            {events.length > 0 ? `${events.length}+ events near you` : 'Discover amazing events'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <EventFiltersBar filters={filters} onChange={setFilters} />

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        )}

        {/* Events Grid */}
        {loading && events.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🎉</p>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              No events found
            </h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {events.map((event) => (
                <EventCard key={event.eventId} event={event} />
              ))}
            </motion.div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Events'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
