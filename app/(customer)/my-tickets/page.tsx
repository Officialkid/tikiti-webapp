'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import TicketCard from '@/components/tickets/TicketCard';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ticketService } from '@/lib/services/ticketService';
import { Ticket } from '@/types/ticket';

export default function MyTicketsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return; }
    if (user) {
      ticketService.getUserTickets(user.uid).then((data) => {
        setTickets(data);
        setFetching(false);
      });
    }
  }, [user, loading, router]);

  const now = new Date();
  const upcoming = tickets.filter((t) => t.eventDate > now);
  const past = tickets.filter((t) => t.eventDate <= now);
  const displayed = tab === 'upcoming' ? upcoming : past;

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1">
          My Tickets 🎟️
        </h1>
        <p className="text-gray-500 mb-6">{tickets.length} total tickets</p>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-800">
          {(['upcoming', 'past'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 px-1 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t} ({t === 'upcoming' ? upcoming.length : past.length})
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">{tab === 'upcoming' ? '🎫' : '📜'}</p>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              No {tab} tickets
            </h3>
            {tab === 'upcoming' && (
              <button
                onClick={() => router.push('/events')}
                className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Find Events
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayed.map((ticket, i) => (
              <motion.div
                key={ticket.ticketId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <TicketCard ticket={ticket} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
