'use client';

import { useState, useEffect, useCallback } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { eventService } from '@/lib/services/eventService';
import { TikitiEvent, EventFilters } from '@/types/event';

export function useEvents(filters?: EventFilters) {
  const [events, setEvents] = useState<TikitiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);

  const fetchEvents = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const result = await eventService.getEvents(
        filters,
        12,
        reset ? undefined : lastDoc ?? undefined
      );

      if (reset) {
        setEvents(result.events);
      } else {
        setEvents((prev: TikitiEvent[]) => [...prev, ...result.events]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.events.length === 12);
    } catch {
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, lastDoc]);

  useEffect(() => {
    fetchEvents(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadMore = () => fetchEvents(false);
  const refresh = () => fetchEvents(true);

  return { events, loading, error, hasMore, loadMore, refresh };
}

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<TikitiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await eventService.getEventById(eventId);
        setEvent(data);
      } catch {
        setError('Failed to load event.');
      } finally {
        setLoading(false);
      }
    };
    if (eventId) fetch();
  }, [eventId]);

  return { event, loading, error };
}
