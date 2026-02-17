'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  QrCodeIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/contexts/AuthContext';
import { eventService } from '@/lib/services/eventService';
import { TikitiEvent } from '@/types/event';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import QRScanner from '@/components/organize/QRScanner';
import EmergencyBroadcast from '@/components/organize/EmergencyBroadcast';

export default function ScannerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<TikitiEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showBroadcast, setShowBroadcast] = useState(false);

  // ── Role guard ────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'organizer')) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ── Fetch organizer's upcoming / live events ──────────────────────
  useEffect(() => {
    if (!user || user.role !== 'organizer') return;

    const fetchEvents = async () => {
      try {
        const all = await eventService.getOrganizerEvents(user.uid);
        // Only show upcoming + live events (can't check-in for past events)
        const scannable = all.filter(
          (e) => e.status === 'upcoming' || e.status === 'live'
        );
        setEvents(scannable);
        if (scannable.length > 0) setSelectedEventId(scannable[0].eventId);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [user]);

  // ── Loading / guard states ────────────────────────────────────────
  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-32 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
        </div>
        <Footer />
      </div>
    );
  }

  if (user?.role !== 'organizer') return null;

  const selectedEvent = events.find((e) => e.eventId === selectedEventId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/organize')}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <QrCodeIcon className="h-7 w-7 text-primary-600" />
              Check-In Scanner
            </h1>
            <p className="text-sm text-gray-500">
              Scan attendee QR codes at the door
            </p>
          </div>
        </div>

        {/* Event Selector */}
        {loadingEvents ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading your events…</p>
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 p-10 text-center mb-6"
          >
            <p className="text-5xl mb-4">📭</p>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              No Upcoming Events
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              You need an upcoming or live event to use the scanner.
            </p>
            <button
              onClick={() => router.push('/organize/create')}
              className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              Create Event
            </button>
          </motion.div>
        ) : (
          <>
            {/* Dropdown */}
            <div className="relative mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Select Event
              </label>
              <div className="relative">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 font-semibold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer"
                >
                  {events.map((ev) => (
                    <option key={ev.eventId} value={ev.eventId}>
                      {ev.title} — {ev.dateTime.toLocaleDateString()} ({ev.status})
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Emergency Broadcast Button */}
            {selectedEvent && (
              <button
                onClick={() => setShowBroadcast(true)}
                className="w-full mb-6 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
              >
                <SpeakerWaveIcon className="h-5 w-5" />
                Emergency Broadcast
              </button>
            )}

            {/* Scanner */}
            {selectedEvent && (
              <QRScanner
                eventId={selectedEvent.eventId}
                eventTitle={selectedEvent.title}
              />
            )}

            {/* Emergency Broadcast Modal */}
            {showBroadcast && selectedEvent && (
              <EmergencyBroadcast
                eventId={selectedEvent.eventId}
                eventTitle={selectedEvent.title}
                onClose={() => setShowBroadcast(false)}
              />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
