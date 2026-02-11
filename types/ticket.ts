export interface Ticket {
  id: string;
  eventId: string;
  ticketTypeId: string;
  userId: string;
  orderId: string;
  qrCode: string;
  redeemed: boolean;
  createdAt: Date;
}
