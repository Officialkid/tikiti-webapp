export type EventCategory =
  | 'campus'
  | 'concert'
  | 'festival'
  | 'sports'
  | 'comedy'
  | 'networking'
  | 'other';

export type EventStatus = 'upcoming' | 'live' | 'past' | 'cancelled';

export type TicketTier =
  | 'Regular'
  | 'VIP'
  | 'VVIP'
  | 'Gold'
  | 'Platinum';

export interface TicketType {
  type: TicketTier;
  price: number;
  quantity: number;
  sold: number;
  description?: string;
}

export interface EventLocation {
  venue: string;
  address: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TikitiEvent {
  eventId: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  imageUrl: string;
  category: EventCategory;
  dateTime: Date;
  endDateTime?: Date;
  location: EventLocation;
  venueCapacity: number;
  currentCapacity: number;
  ticketTypes: TicketType[];
  tags: string[];
  status: EventStatus;
  streamUrl?: string;
  hasVirtualTickets: boolean;
  verified: boolean;
  featured: boolean;
  attendeeCount: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventFilters {
  category?: EventCategory;
  city?: string;
  dateFrom?: Date;
  dateTo?: Date;
  priceMin?: number;
  priceMax?: number;
  hasVirtualTickets?: boolean;
  searchQuery?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  category: EventCategory;
  dateTime: Date;
  endDateTime?: Date;
  location: EventLocation;
  venueCapacity: number;
  ticketTypes: Omit<TicketType, 'sold'>[];
  tags: string[];
  hasVirtualTickets: boolean;
  imageFile?: File;
}
