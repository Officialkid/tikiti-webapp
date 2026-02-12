'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { HeartIcon, MapPinIcon, CalendarIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { TikitiEvent } from '@/types/event';
import { useCart } from '@/lib/contexts/CartContext';
import { useFavorites } from '@/lib/hooks/useFavorites';

interface EventCardProps {
  event: TikitiEvent;
  variant?: 'grid' | 'featured';
}

export default function EventCard({ event, variant = 'grid' }: EventCardProps) {
  const { addItem, items } = useCart();
  const { isFavorited, toggleFavorite } = useFavorites();

  // 3D tilt effect (for featured cards)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (variant !== 'featured') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Cheapest ticket price
  const minPrice = Math.min(...event.ticketTypes.map((t) => t.price));
  const cheapestTicket = event.ticketTypes.find((t) => t.price === minPrice);

  // Check if event is in cart
  const isInCart = items.some((item) => item.eventId === event.eventId);

  // Add to cart handler
  const handleAddToCart = () => {
    if (!cheapestTicket || isInCart) return;
    
    addItem({
      eventId: event.eventId,
      eventTitle: event.title,
      ticketType: cheapestTicket.type,
      price: cheapestTicket.price,
      quantity: 1,
      imageUrl: event.imageUrl,
    });
  };

  // Capacity percentage
  const capacityPct = (event.currentCapacity / event.venueCapacity) * 100;
  const capacityColor =
    capacityPct >= 90 ? 'text-red-500' :
    capacityPct >= 70 ? 'text-orange-500' :
    'text-green-500';

  return (
    <motion.div
      style={variant === 'featured' ? { rotateX, rotateY } : {}}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      className={`relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow ${
        variant === 'featured' ? 'min-w-[300px] [transform-style:preserve-3d]' : ''
      }`}
    >
      {/* Event Image */}
      <Link href={`/events/${event.eventId}`} className="block">
        <div className="relative h-48 overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-5xl">
              🎉
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {event.hasVirtualTickets && (
              <span className="bg-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                📺 Virtual Available
              </span>
            )}
            {event.verified && (
              <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                ✓ Verified
              </span>
            )}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white/90 ${capacityColor}`}>
              {Math.round(capacityPct)}% Full
            </span>
          </div>

          {/* Category Badge */}
          <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full capitalize">
            {event.category}
          </span>
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4">
        <Link href={`/events/${event.eventId}`}>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight hover:text-primary-600 transition-colors line-clamp-2 mb-2">
            {event.title}
          </h3>
        </Link>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            <CalendarIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
            {format(event.dateTime, 'EEE, MMM d • h:mm a')}
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            <MapPinIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
            {event.location.venue}, {event.location.city}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">From</span>
            <div className="text-lg font-black text-primary-600 dark:text-primary-400">
              Ksh {minPrice.toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Favorite */}
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(event.eventId);
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={isFavorited(event.eventId) ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorited(event.eventId) ? (
                <HeartSolid className="h-5 w-5 text-secondary-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Add to Cart */}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              disabled={isInCart}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isInCart
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                  : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
              }`}
            >
              <ShoppingCartIcon className="h-4 w-4" />
              {isInCart ? 'In Cart' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
