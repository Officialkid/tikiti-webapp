export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  venue: string;
  imageUrl?: string;
  organizerId: string;
  ticketTypes: TicketType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
}
