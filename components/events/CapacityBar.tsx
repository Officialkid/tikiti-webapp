'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/config';
import { motion } from 'framer-motion';

interface Props {
  eventId: string;
  initialCurrent: number;
  total: number;
  showDetails?: boolean;
}

export default function CapacityBar({
  eventId, initialCurrent, total, showDetails = true
}: Props) {
  const [current, setCurrent] = useState(initialCurrent);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`capacity-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.current_capacity === 'number') {
            setCurrent(payload.new.current_capacity);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const pct = Math.min((current / total) * 100, 100);
  const remaining = total - current;

  const color =
    pct >= 90 ? { bar: 'bg-red-500', text: 'text-red-600', label: 'Almost full!' } :
    pct >= 70 ? { bar: 'bg-orange-500', text: 'text-orange-600', label: 'Filling up' } :
    { bar: 'bg-green-500', text: 'text-green-600', label: 'Available' };

  return (
    <div className="w-full">
      {/* Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
        <motion.div
          className={`h-full rounded-full ${color.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {showDetails && (
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold ${color.text}`}>
            {color.label}
          </span>
          <span className="text-xs text-gray-500">
            {remaining > 0 ? `${remaining.toLocaleString()} spots left` : 'Sold out'}
          </span>
        </div>
      )}

      {/* Alert banner at 85%+ */}
      {pct >= 85 && pct < 100 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 font-medium"
        >
          ⚠️ This event is almost sold out. Grab your ticket now!
        </motion.div>
      )}
    </div>
  );
}
