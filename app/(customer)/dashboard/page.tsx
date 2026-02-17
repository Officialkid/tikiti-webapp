'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import EventCard from '@/components/events/EventCard';
import EventCardSkeleton from '@/components/events/EventCardSkeleton';
import { useEvents } from '@/lib/hooks/useEvents';
import { EventFilters } from '@/types/event';
import { 
  SparklesIcon, 
  TicketIcon, 
  HeartIcon, 
  ShoppingCartIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  
  const filters: EventFilters = {
    showPublicOnly: true,
    isFree: showFreeOnly || undefined,
  };

  const { events, loading, error, hasMore, loadMore } = useEvents(filters);

  const quickLinks = [
    {
      title: 'My Tickets',
      href: '/my-tickets',
      icon: TicketIcon,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Favorites',
      href: '/favorites',
      icon: HeartIcon,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'Cart',
      href: '/cart',
      icon: ShoppingCartIcon,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      title: 'Organize Event',
      href: '/organize/create',
      icon: SparklesIcon,
      color: 'from-orange-500 to-amber-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-500 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-2">
            Welcome Back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-white/80 text-lg">
            Discover events, manage tickets, and connect with your community
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickLinks.map((link, index) => (
            <motion.div
              key={link.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={link.href}
                className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center mb-4`}>
                  <link.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">{link.title}</h3>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Browse Events Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Browse Events
            </h2>
            <p className="text-gray-600">
              {showFreeOnly ? 'Free events' : 'All public events'}
            </p>
          </div>

          {/* Free Events Filter */}
          <button
            onClick={() => setShowFreeOnly(!showFreeOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
              showFreeOnly
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:border-primary-600'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            {showFreeOnly ? 'Showing Free Only' : 'Show Free Only'}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 text-lg">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && events.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Events Grid */}
        {!loading && events.length === 0 ? (
          <div className="text-center py-16">
            <SparklesIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {showFreeOnly ? 'No free events found' : 'No events found'}
            </h3>
            <p className="text-gray-500 mb-6">
              {showFreeOnly 
                ? 'Try browsing all events or check back later'
                : 'Check back later for exciting new events'
              }
            </p>
            {showFreeOnly && (
              <button
                onClick={() => setShowFreeOnly(false)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Browse All Events
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {events.map((event, index) => (
                <motion.div
                  key={event.eventId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && !loading && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  Load More Events
                </button>
              </div>
            )}

            {loading && events.length > 0 && (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
              </div>
            )}
          </>
        )}

        {/* Call to Action for Organizers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-primary-600 to-secondary-500 rounded-2xl p-8 text-center text-white"
        >
          <SparklesIcon className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Ready to Host Your Own Event?</h3>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Anyone can become an organizer on Tikiti Store! Create your event, sell tickets, and bring your community together.
          </p>
          <Link
            href="/organize/create"
            className="inline-block px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors font-bold"
          >
            Create Your First Event
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
