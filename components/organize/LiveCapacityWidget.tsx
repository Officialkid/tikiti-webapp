'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { TikitiEvent } from '@/types/event';

interface Props { event: TikitiEvent; }

export default function LiveCapacityWidget({ event }: Props) {
  const [current, setCurrent] = useState(event.currentCapacity);

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'events', event.eventId), (snap) => {
      if (snap.exists()) setCurrent(snap.data().currentCapacity || 0);
    });
    return () => unsub();
  }, [event.eventId]);

  const pct = Math.round((current / event.venueCapacity) * 100);
  const isAlert = pct >= 80;

  return (
    <div className={`rounded-xl p-4 border-2 ${isAlert ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        Live Capacity — {event.title}
      </p>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-black ${isAlert ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
          {current.toLocaleString()}
        </span>
        <span className="text-gray-400">/ {event.venueCapacity.toLocaleString()}</span>
        <span className={`text-sm font-bold ml-auto ${isAlert ? 'text-red-600' : 'text-green-600'}`}>
          {pct}%
        </span>
      </div>
      {isAlert && (
        <p className="text-xs text-red-600 mt-1 font-medium">
          🚨 Venue at {pct}% — consider slowing entry
        </p>
      )}
    </div>
  );
}
