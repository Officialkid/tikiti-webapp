'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { TikitiEvent, TicketType } from '@/types/event';
import { useCart } from '@/lib/contexts/CartContext';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { format } from 'date-fns';
import {
  HeartIcon,
  CalendarIcon,
  BellIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  TagIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';
import CapacityBar from './CapacityBar';
import TicketSelector from './TicketSelector';

interface EventDetailsClientProps {
  event: TikitiEvent;
}

export default function EventDetailsClient({ event }: EventDetailsClientProps) {
  const { addItem } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const isFavorited = favorites.includes(event.eventId);

  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!selectedTicket) return;

    addItem({
      eventId: event.eventId,
      eventTitle: event.title,
      ticketType: selectedTicket.type,
      price: selectedTicket.price,
      quantity: quantity,
      imageUrl: event.imageUrl || '',
    });

    toast.success(`${quantity} ticket(s) added to cart!`);
  };

  const handleDownloadCalendar = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tikiti//Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.eventId}@tikiti.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${event.dateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${event.endDateTime?.toISOString().replace(/[-:]/g, '').split('.')[0] || event.dateTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location.address}${event.location.city ? `, ${event.location.city}` : ''}`,
      `URL:${typeof window !== 'undefined' ? window.location.href : ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Calendar event downloaded!');
  };

  const handleSetReminder = async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      scheduleReminder();
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        scheduleReminder();
      } else {
        toast.error('Notification permission denied');
      }
    } else {
      toast.error('Notifications are blocked. Enable them in browser settings.');
    }
  };

  const scheduleReminder = () => {
    const eventTime = event.dateTime.getTime();
    const reminderTime = eventTime - 60 * 60 * 1000; // 1 hour before
    const now = Date.now();

    if (reminderTime > now) {
      const delay = reminderTime - now;
      setTimeout(() => {
        new Notification('Event Reminder', {
          body: `${event.title} starts in 1 hour!`,
          icon: event.imageUrl || '/images/logo.png',
          tag: event.eventId,
        });
      }, delay);
      toast.success('Reminder set for 1 hour before event!');
    } else {
      toast.error('Event is starting too soon to set a reminder');
    }
  };

  const cheapestTicket = event.ticketTypes.reduce((min, ticket) =>
    ticket.price < min.price ? ticket : min
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Image */}
      <div className="relative w-full h-[400px] md:h-[500px]">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
            <CalendarIcon className="h-32 w-32 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Virtual Badge */}
        {event.hasVirtualTickets && (
          <div className="absolute top-6 left-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full font-semibold text-sm">
              <VideoCameraIcon className="h-5 w-5" />
              Virtual Available
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={() => toggleFavorite(event.eventId)}
            className="p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            {isFavorited ? (
              <HeartSolidIcon className="h-6 w-6 text-red-500" />
            ) : (
              <HeartIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
          <button
            onClick={handleDownloadCalendar}
            className="p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <CalendarIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={handleSetReminder}
            className="p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <BellIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Organizer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                    {event.title}
                  </h1>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <BuildingOfficeIcon className="h-5 w-5" />
                    <span className="font-medium">{event.organizerName}</span>
                    {event.verified && (
                      <CheckBadgeIcon className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
                <span className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full font-semibold text-sm">
                  {event.category}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                  >
                    <TagIcon className="h-4 w-4" />
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Event Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date & Time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <ClockIcon className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Date & Time
                  </h2>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {format(event.dateTime, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {format(event.dateTime, 'h:mm a')} -{' '}
                    {format(event.endDateTime || event.dateTime, 'h:mm a')}
                  </p>
                </div>
              </motion.div>

              {/* Location */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <MapPinIcon className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Location
                  </h2>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {event.location.venue}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {event.location.address}
                  </p>
                  {event.location.city && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {event.location.city}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Capacity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <UserGroupIcon className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Capacity
                  </h2>
                </div>
                <CapacityBar
                  current={event.currentCapacity || 0}
                  total={event.venueCapacity}
                />
              </motion.div>

              {/* Price Range */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <TagIcon className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Tickets From
                  </h2>
                </div>
                <div className="text-3xl font-black text-primary-600 dark:text-primary-400">
                  Ksh {cheapestTicket.price.toLocaleString()}
                </div>
              </motion.div>
            </div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                About This Event
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Sticky Sidebar - Ticket Selector */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <TicketSelector
                event={event}
                selectedTicket={selectedTicket}
                quantity={quantity}
                onSelectTicket={setSelectedTicket}
                onQuantityChange={setQuantity}
                onAddToCart={handleAddToCart}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
