import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.enum(['campus', 'concert', 'festival', 'sports', 'comedy', 'networking', 'other']),
  tags: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  venueName: z.string().min(2, 'Venue name required'),
  address: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  venueCapacity: z.number().min(10, 'Minimum 10 capacity').max(100000),
  hasVirtualTickets: z.boolean(),
  ticketTypes: z.array(z.object({
    type: z.enum(['Regular', 'VIP', 'VVIP', 'Gold', 'Platinum']),
    price: z.number().min(0, 'Price cannot be negative'),
    quantity: z.number().min(1, 'Minimum 1 ticket'),
    description: z.string().optional(),
  })).min(1, 'Add at least one ticket type'),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
