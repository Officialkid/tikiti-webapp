'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { TikitiEvent } from '@/types/event';
import { eventService } from '@/lib/services/eventService';
import { format } from 'date-fns';
import { MapPinIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function FeaturedEventsSection() {
  const [events, setEvents] = useState<TikitiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const featuredEvents = await eventService.getFeaturedEvents();
        setEvents(featuredEvents);
      } catch (error) {
        console.error('Failed to load featured events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
              Featured Events
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Loading amazing events...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md animate-pulse"
              >
                <div className="h-48 bg-gray-300 dark:bg-gray-700" />
                <div className="p-6">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-4" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
            Featured Events
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            No featured events right now. Check back soon!
          </p>
          <Link
            href="/events"
            className="inline-block px-8 py-4 bg-primary-600 text-white font-bold rounded-full hover:bg-primary-700 transition-colors"
          >
            Browse All Events
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
            Featured Events
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Don&apos;t miss out on these trending events
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {events.map((event, index) => (
            <motion.div
              key={event.eventId}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Link href={`/events/${event.eventId}`}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all cursor-pointer group">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-primary-400 to-secondary-400 overflow-hidden">
                    {event.imageUrl ? (
                      <Image
                        src={event.imageUrl}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                        🎉
                      </div>
                    )}
                    {event.featured && (
                      <div className="absolute top-4 right-4 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        FEATURED
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {event.title}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {format(event.dateTime, 'MMM dd, yyyy • h:mm a')}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        {event.location.venue}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <UserGroupIcon className="w-4 h-4 mr-2" />
                        {event.ticketTypes[0]?.sold || 0} / {event.ticketTypes[0]?.quantity || 0} attending
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">From</span>
                        <p className="text-2xl font-black text-primary-600 dark:text-primary-400">
                          KSh {Math.min(...event.ticketTypes.map(t => t.price)).toLocaleString()}
                        </p>
                      </div>
                      {event.hasVirtualTickets && (
                        <div className="bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 px-3 py-1 rounded-full text-xs font-bold">
                          🌐 Virtual
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link
            href="/events"
            className="inline-block px-10 py-4 bg-primary-600 text-white font-bold rounded-full text-lg hover:bg-primary-700 transition-colors shadow-lg"
          >
            View All Events →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
