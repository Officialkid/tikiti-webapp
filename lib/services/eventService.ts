import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { TikitiEvent, CreateEventData, EventFilters } from '@/types/event';
import { v4 as uuidv4 } from 'uuid';

export const eventService = {

  // ─── GET ALL EVENTS (with optional filters) ─────────────────────
  async getEvents(
    filters?: EventFilters,
    pageSize: number = 12,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{ events: TikitiEvent[]; lastDoc: QueryDocumentSnapshot | null }> {
    if (!db) throw new Error('Firestore not initialized');

    try {
      const eventsRef = collection(db, 'events');
      const constraints: any[] = [
        where('status', '!=', 'cancelled'),
        orderBy('status'),
        orderBy('dateTime', 'asc'),
      ];

      if (filters?.category) {
        constraints.push(where('category', '==', filters.category));
      }

      if (filters?.hasVirtualTickets) {
        constraints.push(where('hasVirtualTickets', '==', true));
      }

      constraints.push(limit(pageSize));

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(eventsRef, ...constraints);
      const snapshot = await getDocs(q);

      const events = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        eventId: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime.toDate(),
        endDateTime: doc.data().endDateTime?.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as TikitiEvent[];

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

      return { events, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // ─── GET SINGLE EVENT ────────────────────────────────────────────
  async getEventById(eventId: string): Promise<TikitiEvent | null> {
    if (!db) throw new Error('Firestore not initialized');

    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) return null;

      const data = eventSnap.data();
      return {
        eventId: eventSnap.id,
        ...data,
        dateTime: data.dateTime.toDate(),
        endDateTime: data.endDateTime?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as TikitiEvent;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  // ─── GET FEATURED EVENTS ─────────────────────────────────────────
  async getFeaturedEvents(): Promise<TikitiEvent[]> {
    if (!db) throw new Error('Firestore not initialized');

    try {
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('featured', '==', true),
        where('status', '==', 'upcoming'),
        orderBy('dateTime', 'asc'),
        limit(6)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        eventId: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime.toDate(),
        endDateTime: doc.data().endDateTime?.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as TikitiEvent[];
    } catch (error) {
      console.error('Error fetching featured events:', error);
      throw error;
    }
  },

  // ─── GET ORGANIZER EVENTS ────────────────────────────────────────
  async getOrganizerEvents(organizerId: string): Promise<TikitiEvent[]> {
    if (!db) throw new Error('Firestore not initialized');

    try {
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('organizerId', '==', organizerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        eventId: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime.toDate(),
        endDateTime: doc.data().endDateTime?.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as TikitiEvent[];
    } catch (error) {
      console.error('Error fetching organizer events:', error);
      throw error;
    }
  },

  // ─── CREATE EVENT ────────────────────────────────────────────────
  async createEvent(
    data: CreateEventData,
    organizerId: string,
    organizerName: string
  ): Promise<string> {
    if (!db || !storage) throw new Error('Firebase not initialized');

    try {
      const eventId = uuidv4();
      let imageUrl = '/images/default-event.jpg';

      // Upload image if provided
      if (data.imageFile) {
        const imageRef = ref(
          storage,
          `events/${eventId}/${data.imageFile.name}`
        );
        const snapshot = await uploadBytes(imageRef, data.imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const ticketTypesWithSold = data.ticketTypes.map((tt) => ({
        ...tt,
        sold: 0,
      }));

      const eventData = {
        eventId,
        organizerId,
        organizerName,
        title: data.title,
        description: data.description,
        imageUrl,
        category: data.category,
        dateTime: Timestamp.fromDate(data.dateTime),
        endDateTime: data.endDateTime
          ? Timestamp.fromDate(data.endDateTime)
          : null,
        location: data.location,
        venueCapacity: data.venueCapacity,
        currentCapacity: 0,
        ticketTypes: ticketTypesWithSold,
        tags: data.tags,
        status: 'upcoming',
        hasVirtualTickets: data.hasVirtualTickets,
        verified: false, // Requires admin approval
        featured: false,
        attendeeCount: 0,
        likes: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'events', eventId), eventData);
      return eventId;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // ─── UPDATE EVENT ────────────────────────────────────────────────
  async updateEvent(
    eventId: string,
    data: Partial<CreateEventData>
  ): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    try {
      const updates: any = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      if (data.dateTime) {
        updates.dateTime = Timestamp.fromDate(data.dateTime);
      }

      if (data.endDateTime) {
        updates.endDateTime = Timestamp.fromDate(data.endDateTime);
      }

      await updateDoc(doc(db, 'events', eventId), updates);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // ─── INCREMENT CAPACITY (called on check-in) ─────────────────────
  async incrementCapacity(eventId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    try {
      await updateDoc(doc(db, 'events', eventId), {
        currentCapacity: increment(1),
      });
    } catch (error) {
      console.error('Error incrementing capacity:', error);
      throw error;
    }
  },

  // ─── DECREMENT CAPACITY (called on check-out) ────────────────────
  async decrementCapacity(eventId: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');

    try {
      await updateDoc(doc(db, 'events', eventId), {
        currentCapacity: increment(-1),
      });
    } catch (error) {
      console.error('Error decrementing capacity:', error);
      throw error;
    }
  },

  // ─── SEARCH EVENTS ───────────────────────────────────────────────
  async searchEvents(searchQuery: string): Promise<TikitiEvent[]> {
    if (!db) throw new Error('Firestore not initialized');

    // Firebase doesn't support full-text search natively.
    // Simple implementation: fetch recent events and filter client-side.
    // For production, integrate Algolia or Typesense.
    try {
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('status', '==', 'upcoming'),
        orderBy('dateTime', 'asc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const allEvents = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        eventId: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime.toDate(),
        endDateTime: doc.data().endDateTime?.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as TikitiEvent[];

      const lower = searchQuery.toLowerCase();
      return allEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(lower) ||
          e.description.toLowerCase().includes(lower) ||
          e.location.city.toLowerCase().includes(lower) ||
          e.tags.some((t) => t.toLowerCase().includes(lower))
      );
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  },
};
