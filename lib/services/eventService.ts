import { supabase } from '@/lib/supabase/config';
import { TikitiEvent, CreateEventData, EventFilters } from '@/types/event';
import { v4 as uuidv4 } from 'uuid';

export const eventService = {

  // ─── GET ALL EVENTS (with optional filters) ─────────────────────
  async getEvents(
    filters?: EventFilters,
    pageSize: number = 12,
    lastEventId?: string
  ): Promise<{ events: TikitiEvent[]; lastEventId: string | null }> {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .neq('status', 'cancelled')
        .order('start_date', { ascending: true })
        .limit(pageSize);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.showPublicOnly) {
        query = query.eq('is_public', true);
      }

      if (lastEventId) {
        const { data: lastEvent } = await supabase
          .from('events')
          .select('start_date')
          .eq('id', lastEventId)
          .single();
        
        if (lastEvent && typeof lastEvent === 'object' && 'start_date' in lastEvent) {
          query = query.gt('start_date', lastEvent.start_date);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch ticket types for each event
      const events: TikitiEvent[] = [];
      for (const row of (data || [])) {
        const { data: ticketTypes } = await supabase
          .from('ticket_types')
          .select('*')
          .eq('event_id', row.id);

        events.push({
          eventId: row.id,
          title: row.title,
          description: row.description,
          organizerId: row.organizer_id,
          organizerName: 'Organizer',
          imageUrl: row.image_url,
          category: row.category,
          dateTime: new Date(row.start_date),
          endDateTime: row.end_date ? new Date(row.end_date) : null,
          location: {
            venue: row.venue_name,
            address: row.venue_address,
            city: row.city,
            country: row.country,
          },
          venueCapacity: row.venue_capacity || 0,
          currentCapacity: row.current_capacity || 0,
          ticketTypes: (ticketTypes || []).map((tt: any) => ({
            id: tt.id,
            name: tt.name,
            price: tt.price,
            currency: tt.currency,
            quantity: tt.quantity,
            sold: tt.sold || 0,
            description: tt.description,
          })),
          tags: row.tags || [],
          status: row.status,
          hasVirtualTickets: row.has_virtual_tickets || false,
          isPublic: row.is_public,
          verified: row.verified || false,
          featured: row.featured || false,
          attendeeCount: row.attendee_count || 0,
          likes: row.likes || 0,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        });
      }

      // Client-side filter for free events
      let filteredEvents = events;
      if (filters?.isFree) {
        filteredEvents = events.filter(event => 
          event.ticketTypes.some(ticket => ticket.price === 0)
        );
      }

      const lastId = filteredEvents.length > 0 ? filteredEvents[filteredEvents.length - 1].eventId : null;

      return { events: filteredEvents, lastEventId: lastId };
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // ─── GET SINGLE EVENT ────────────────────────────────────────────
  async getEventById(eventId: string): Promise<TikitiEvent | null> {
    try {
      const { data: row, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !row) return null;

      // Fetch ticket types
      const { data: ticketTypes } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId);

      return {
        eventId: row.id,
        title: row.title,
        description: row.description,
        organizerId: row.organizer_id,
        organizerName: 'Organizer',
        imageUrl: row.image_url,
        category: row.category,
        dateTime: new Date(row.start_date),
        endDateTime: row.end_date ? new Date(row.end_date) : null,
        location: {
          venue: row.venue_name,
          address: row.venue_address,
          city: row.city,
          country: row.country,
        },
        venueCapacity: row.venue_capacity || 0,
        currentCapacity: row.current_capacity || 0,
        ticketTypes: (ticketTypes || []).map((tt: any) => ({
          id: tt.id,
          name: tt.name,
          price: tt.price,
          currency: tt.currency,
          quantity: tt.quantity,
          sold: tt.sold || 0,
          description: tt.description,
        })),
        tags: row.tags || [],
        status: row.status,
        hasVirtualTickets: row.has_virtual_tickets || false,
        isPublic: row.is_public,
        verified: row.verified || false,
        featured: row.featured || false,
        attendeeCount: row.attendee_count || 0,
        likes: row.likes || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      } as TikitiEvent;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  // ─── GET FEATURED EVENTS ─────────────────────────────────────────
  async getFeaturedEvents(): Promise<TikitiEvent[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('featured', true)
        .eq('status', 'upcoming')
        .order('start_date', { ascending: true })
        .limit(6);

      if (error) throw error;

      const events: TikitiEvent[] = [];
      for (const row of (data || [])) {
        const { data: ticketTypes } = await supabase
          .from('ticket_types')
          .select('*')
          .eq('event_id', row.id);

        events.push({
          eventId: row.id,
          title: row.title,
          description: row.description,
          organizerId: row.organizer_id,
          organizerName: 'Organizer',
          imageUrl: row.image_url,
          category: row.category,
          dateTime: new Date(row.start_date),
          endDateTime: row.end_date ? new Date(row.end_date) : null,
          location: {
            venue: row.venue_name,
            address: row.venue_address,
            city: row.city,
            country: row.country,
          },
          venueCapacity: row.venue_capacity || 0,
          currentCapacity: row.current_capacity || 0,
          ticketTypes: (ticketTypes || []).map((tt: any) => ({
            id: tt.id,
            name: tt.name,
            price: tt.price,
            currency: tt.currency,
            quantity: tt.quantity,
            sold: tt.sold || 0,
            description: tt.description,
          })),
          tags: row.tags || [],
          status: row.status,
          hasVirtualTickets: row.has_virtual_tickets || false,
          isPublic: row.is_public,
          verified: row.verified || false,
          featured: row.featured || false,
          attendeeCount: row.attendee_count || 0,
          likes: row.likes || 0,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        });
      }

      return events;
    } catch (error) {
      console.error('Error fetching featured events:', error);
      throw error;
    }
  },

  // ─── GET ORGANIZER EVENTS ────────────────────────────────────────
  async getOrganizerEvents(organizerId: string): Promise<TikitiEvent[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', organizerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const events: TikitiEvent[] = [];
      for (const row of (data || [])) {
        const { data: ticketTypes } = await supabase
          .from('ticket_types')
          .select('*')
          .eq('event_id', row.id);

        events.push({
          eventId: row.id,
          title: row.title,
          description: row.description,
          organizerId: row.organizer_id,
          organizerName: 'Organizer',
          imageUrl: row.image_url,
          category: row.category,
          dateTime: new Date(row.start_date),
          endDateTime: row.end_date ? new Date(row.end_date) : null,
          location: {
            venue: row.venue_name,
            address: row.venue_address,
            city: row.city,
            country: row.country,
          },
          venueCapacity: row.venue_capacity || 0,
          currentCapacity: row.current_capacity || 0,
          ticketTypes: (ticketTypes || []).map((tt: any) => ({
            id: tt.id,
            name: tt.name,
            price: tt.price,
            currency: tt.currency,
            quantity: tt.quantity,
            sold: tt.sold || 0,
            description: tt.description,
          })),
          tags: row.tags || [],
          status: row.status,
          hasVirtualTickets: row.has_virtual_tickets || false,
          isPublic: row.is_public,
          verified: row.verified || false,
          featured: row.featured || false,
          attendeeCount: row.attendee_count || 0,
          likes: row.likes || 0,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        });
      }

      return events;
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
    try {
      const eventId = uuidv4();
      let imageUrl = '/images/default-event.jpg';

      // Upload image if provided
      if (data.imageFile) {
        const fileName = `${eventId}/${data.imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, data.imageFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('event-images')
            .getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      // Insert event
      const { error: eventError } = await supabase
        .from('events')
        .insert({
          id: eventId,
          organizer_id: organizerId,
          title: data.title,
          description: data.description,
          image_url: imageUrl,
          category: data.category,
          start_date: data.dateTime.toISOString(),
          end_date: data.endDateTime?.toISOString() || null,
          venue_name: data.location.venue,
          venue_address: data.location.address,
          city: data.location.city,
          country: data.location.country,
          venue_capacity: data.venueCapacity,
          current_capacity: 0,
          tags: data.tags,
          status: 'upcoming',
          has_virtual_tickets: data.hasVirtualTickets,
          is_public: data.isPublic,
          verified: false,
          featured: false,
          attendee_count: 0,
          likes: 0,
        });

      if (eventError) throw eventError;

      // Insert ticket types
      for (const tt of data.ticketTypes) {
        const { error: ticketTypeError } = await supabase
          .from('ticket_types')
          .insert({
            id: uuidv4(),
            event_id: eventId,
            name: tt.name,
            price: tt.price,
            currency: tt.currency,
            quantity: tt.quantity,
            sold: 0,
            description: tt.description,
          });

        if (ticketTypeError) throw ticketTypeError;
      }

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
    try {
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (data.title) updates.title = data.title;
      if (data.description) updates.description = data.description;
      if (data.category) updates.category = data.category;
      if (data.dateTime) updates.start_date = data.dateTime.toISOString();
      if (data.endDateTime) updates.end_date = data.endDateTime.toISOString();
      if (data.location) {
        updates.venue_name = data.location.venue;
        updates.venue_address = data.location.address;
        updates.city = data.location.city;
        updates.country = data.location.country;
      }
      if (data.venueCapacity) updates.venue_capacity = data.venueCapacity;
      if (data.tags) updates.tags = data.tags;
      if (typeof data.hasVirtualTickets === 'boolean') updates.has_virtual_tickets = data.hasVirtualTickets;
      if (typeof data.isPublic === 'boolean') updates.is_public = data.isPublic;

      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // ─── INCREMENT CAPACITY (called on check-in) ─────────────────────
  async incrementCapacity(eventId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('current_capacity')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('events')
        .update({ current_capacity: (data.current_capacity || 0) + 1 })
        .eq('id', eventId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error incrementing capacity:', error);
      throw error;
    }
  },

  // ─── DECREMENT CAPACITY (called on check-out) ────────────────────
  async decrementCapacity(eventId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('current_capacity')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('events')
        .update({ current_capacity: Math.max(0, (data.current_capacity || 0) - 1) })
        .eq('id', eventId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error decrementing capacity:', error);
      throw error;
    }
  },

  // ─── SEARCH EVENTS ───────────────────────────────────────────────
  async searchEvents(searchQuery: string): Promise<TikitiEvent[]> {
    try {
      // Fetch recent upcoming events and filter client-side
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'upcoming')
        .order('start_date', { ascending: true })
        .limit(50);

      if (error) throw error;

      const events: TikitiEvent[] = [];
      const lower = searchQuery.toLowerCase();

      for (const row of (data || [])) {
        // Client-side filtering
        const matches = 
          row.title.toLowerCase().includes(lower) ||
          row.description.toLowerCase().includes(lower) ||
          row.city.toLowerCase().includes(lower) ||
          (row.tags || []).some((t: string) => t.toLowerCase().includes(lower));

        if (!matches) continue;

        const { data: ticketTypes } = await supabase
          .from('ticket_types')
          .select('*')
          .eq('event_id', row.id);

        events.push({
          eventId: row.id,
          title: row.title,
          description: row.description,
          organizerId: row.organizer_id,
          organizerName: 'Organizer',
          imageUrl: row.image_url,
          category: row.category,
          dateTime: new Date(row.start_date),
          endDateTime: row.end_date ? new Date(row.end_date) : null,
          location: {
            venue: row.venue_name,
            address: row.venue_address,
            city: row.city,
            country: row.country,
          },
          venueCapacity: row.venue_capacity || 0,
          currentCapacity: row.current_capacity || 0,
          ticketTypes: (ticketTypes || []).map((tt: any) => ({
            id: tt.id,
            name: tt.name,
            price: tt.price,
            currency: tt.currency,
            quantity: tt.quantity,
            sold: tt.sold || 0,
            description: tt.description,
          })),
          tags: row.tags || [],
          status: row.status,
          hasVirtualTickets: row.has_virtual_tickets || false,
          isPublic: row.is_public,
          verified: row.verified || false,
          featured: row.featured || false,
          attendeeCount: row.attendee_count || 0,
          likes: row.likes || 0,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        });
      }

      return events;
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  },
};
